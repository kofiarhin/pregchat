import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiArrowLeft, FiLoader, FiMic, FiRotateCcw, FiSquare, FiType } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import content from "../../content/appContent.json";
import { http } from "../../api/http.js";
import { useChatMessages } from "../../features/messages/hooks/useChatMessages.js";
import { useTodayPregnancyQuery } from "../../features/pregnancy/hooks/usePregnancy.js";
import useVoice from "../../hooks/useVoice.js";
import styles from "./voiceChat.styles.module.scss";

const formatTime = (value) => {
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "";
  }
};

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const VoiceChat = () => {
  const navigate = useNavigate();
  const pageCopy = content.voice?.page ?? {};
  const controlsCopy = pageCopy.controls ?? {};
  const statusCopy = pageCopy.status ?? {};
  const messageCopy = pageCopy.messages ?? {};
  const errorCopy = pageCopy.errors ?? {};

  const conversationRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const usingFallbackRef = useRef(false);
  const transcriptRef = useRef("");
  const transcriptHandlerRef = useRef(() => {});
  const micStateRef = useRef("idle");

  const [micState, setMicStateValue] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastAssistantReply, setLastAssistantReply] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { messages, appendMessages } = useChatMessages();
  const { data: daySummary } = useTodayPregnancyQuery({ enabled: true });

  const setMicState = useCallback((next) => {
    micStateRef.current = next;
    setMicStateValue(next);
  }, []);

  useEffect(() => {
    if (micState === "recording") {
      setStatusMessage(statusCopy.listening || "");
    } else if (micState === "processing") {
      setStatusMessage(statusCopy.processing || "");
    } else {
      setStatusMessage("");
    }
  }, [micState, statusCopy.listening, statusCopy.processing]);

  const stopPlayback = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setIsSpeaking(false);
  }, []);

  const handleSpeakStart = useCallback(() => {
    setIsSpeaking(true);
  }, []);

  const handleSpeakEnd = useCallback(() => {
    setIsSpeaking(false);
  }, []);

  const handleListenStart = useCallback(() => {
    setErrorMessage("");
    setMicState("recording");
  }, [setMicState]);

  const handleNoSpeech = useCallback(() => {
    if (messageCopy.noSpeech) {
      setErrorMessage(messageCopy.noSpeech);
    }
  }, [messageCopy.noSpeech]);

  const handleListenEnd = useCallback(() => {
    if (micStateRef.current === "recording" && !transcriptRef.current) {
      setMicState("idle");
      handleNoSpeech();
    }
  }, [handleNoSpeech, setMicState]);

  const handleVoiceError = useCallback(
    (event) => {
      setMicState("idle");
      const type = event?.error;

      if (type === "not-allowed" || type === "service-not-allowed") {
        setErrorMessage(
          errorCopy.permission || messageCopy.permission || "Enable mic access in site settings",
        );
        return;
      }

      if (type === "no-speech") {
        handleNoSpeech();
        return;
      }

      const fallback =
        errorCopy.recognition || messageCopy.recognition || "We couldn't start voice recognition.";
      setErrorMessage(fallback);
    },
    [errorCopy.permission, errorCopy.recognition, handleNoSpeech, messageCopy.permission, messageCopy.recognition, setMicState],
  );

  const {
    supported,
    transcript,
    start,
    stop,
    speak,
    cancelSpeech,
    setTranscript,
  } = useVoice({
    continuous: false,
    interimResults: true,
    autoSendOnFinal: true,
    onFinalTranscript: (finalTranscript) => {
      const phrase = finalTranscript?.trim() || "";
      transcriptRef.current = phrase;
      transcriptHandlerRef.current(phrase);
    },
    onError: handleVoiceError,
    onListenStart: handleListenStart,
    onListenEnd: handleListenEnd,
    onSpeakStart: handleSpeakStart,
    onSpeakEnd: handleSpeakEnd,
  });

  useEffect(() => {
    transcriptRef.current = transcript?.trim() || "";
  }, [transcript]);

  useEffect(() => {
    const latestAssistant = [...(messages ?? [])]
      .reverse()
      .find((entry) => entry?.role === "assistant" && entry?.content);

    if (latestAssistant) {
      setLastAssistantReply(latestAssistant.content);
    } else {
      setLastAssistantReply("");
    }
  }, [messages]);

  useEffect(() => {
    const node = conversationRef.current;
    if (!node) {
      return;
    }

    node.scrollTop = node.scrollHeight;
  }, [messages?.length, isSending]);

  useEffect(
    () => () => {
      stopPlayback();
      cancelSpeech();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch (error) {
          // ignore cleanup errors
        }
      }
    },
    [stopPlayback, cancelSpeech],
  );

  const speakReply = useCallback(
    async (text) => {
      const phrase = (text || "").trim();
      if (!phrase) {
        return;
      }

      stopPlayback();
      cancelSpeech();

      if (supported.tts) {
        speak(phrase, {
          rate: 0.96,
          pitch: 1,
          volume: 1,
        });
        return;
      }

      try {
        const audioBlob = await http.post("/api/speech/tts", {
          json: { text: phrase },
          responseType: "blob",
        });

        if (!(audioBlob instanceof Blob)) {
          setErrorMessage(errorCopy.tts || "");
          return;
        }

        const url = URL.createObjectURL(audioBlob);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        setIsSpeaking(true);

        audio.onended = () => {
          setIsSpeaking(false);
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          audioRef.current = null;
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          audioRef.current = null;
          setErrorMessage(errorCopy.tts || "");
        };

        await audio.play();
      } catch (error) {
        setIsSpeaking(false);
        setErrorMessage(error?.message || errorCopy.tts || "");
      }
    },
    [cancelSpeech, errorCopy.tts, speak, stopPlayback, supported.tts],
  );

  const sendMessage = useCallback(
    async (text) => {
      const cleaned = (text || "").trim();
      if (!cleaned) {
        return;
      }

      const timestamp = new Date().toISOString();
      const userMessage = {
        id: genId(),
        role: "user",
        content: cleaned,
        timestamp,
      };

      await appendMessages(userMessage);
      setIsSending(true);

      try {
        const payload = {
          text: cleaned,
          ...(daySummary
            ? {
                dayData: {
                  dayIndex: daySummary.day,
                  babyUpdate: daySummary.babyUpdate,
                  momUpdate: daySummary.momUpdate,
                  tips: daySummary.tips,
                },
              }
            : {}),
        };

        const data = await http.post("/chat/ask", { json: payload });
        const assistantContent =
          data?.content ||
          data?.message ||
          errorCopy.response ||
          "I'm not sure how to respond right now, but I'm here for you.";

        const assistantMessage = {
          id: genId(),
          role: "assistant",
          content: assistantContent,
          timestamp: new Date().toISOString(),
          meta: data?.triage ? { triage: true } : undefined,
        };

        await appendMessages(assistantMessage);
        setLastAssistantReply(assistantContent);
        await speakReply(assistantContent);
        setErrorMessage("");
      } catch (error) {
        const fallback = error?.message || errorCopy.response || "Failed to send message.";
        await appendMessages({
          id: genId(),
          role: "assistant",
          content: fallback,
          timestamp: new Date().toISOString(),
        });
        setErrorMessage(fallback);
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [appendMessages, daySummary, errorCopy.response, speakReply],
  );

  const handleTranscript = useCallback(
    async (rawText, { clearRecognition = false } = {}) => {
      const text = (rawText || "").trim();
      if (!text) {
        setMicState("idle");
        handleNoSpeech();
        if (clearRecognition) {
          setTranscript("");
        }
        return;
      }

      setErrorMessage("");
      setMicState("processing");

      try {
        await sendMessage(text);
      } catch (error) {
        // error state already handled in sendMessage
      } finally {
        setMicState("idle");
        if (clearRecognition) {
          setTranscript("");
          transcriptRef.current = "";
        }
      }
    },
    [handleNoSpeech, sendMessage, setMicState, setTranscript],
  );

  useEffect(() => {
    transcriptHandlerRef.current = (phrase) => {
      const text = (phrase || "").trim();

      if (!text) {
        setTranscript("");
        transcriptRef.current = "";
        setMicState("idle");
        handleNoSpeech();
        return;
      }

      handleTranscript(text, { clearRecognition: true });
    };
  }, [handleNoSpeech, handleTranscript, setMicState, setTranscript]);

  const handleFallbackTranscription = useCallback(
    async (audioBlob) => {
      if (!(audioBlob instanceof Blob) || audioBlob.size === 0) {
        setMicState("idle");
        handleNoSpeech();
        return;
      }

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, `voice-${Date.now()}.webm`);

        const result = await http.post("/api/speech/stt", { body: formData });
        const text = result?.text?.trim();

        if (!text) {
          setMicState("idle");
          handleNoSpeech();
          return;
        }

        await handleTranscript(text);
      } catch (error) {
        setMicState("idle");
        const fallback =
          error?.message || errorCopy.transcription || "We couldn't transcribe that just now.";
        setErrorMessage(fallback);
      }
    },
    [errorCopy.transcription, handleNoSpeech, handleTranscript, setMicState],
  );

  const startFallbackRecording = useCallback(async () => {
    if (typeof window === "undefined") {
      setErrorMessage(errorCopy.unsupported || "");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === "undefined") {
      setErrorMessage(errorCopy.unsupported || "");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      usingFallbackRef.current = true;
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.onstart = () => {
        setErrorMessage("");
        setMicState("recording");
      };

      recorder.ondataavailable = (event) => {
        if (event?.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        setMicState("idle");
        const fallback =
          event?.error?.message || errorCopy.recording || "We couldn't access your microphone.";
        setErrorMessage(fallback);
        stream.getTracks().forEach((track) => track.stop());
        usingFallbackRef.current = false;
        recorderRef.current = null;
        recordedChunksRef.current = [];
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        usingFallbackRef.current = false;
        const chunks = recordedChunksRef.current;
        recordedChunksRef.current = [];
        recorderRef.current = null;
        if (!chunks.length) {
          setMicState("idle");
          handleNoSpeech();
          return;
        }

        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        setMicState("processing");
        await handleFallbackTranscription(blob);
      };

      recorder.start();
    } catch (error) {
      usingFallbackRef.current = false;
      recorderRef.current = null;
      recordedChunksRef.current = [];

      if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
        setErrorMessage(
          errorCopy.permission || messageCopy.permission || "Enable mic access in site settings",
        );
      } else {
        setErrorMessage(error?.message || errorCopy.recording || "We couldn't access your microphone.");
      }

      setMicState("idle");
    }
  }, [errorCopy.permission, errorCopy.recording, errorCopy.unsupported, handleFallbackTranscription, handleNoSpeech, messageCopy.permission, setMicState]);

  const handleStartRecording = useCallback(() => {
    setErrorMessage("");
    stopPlayback();
    cancelSpeech();

    if (supported.stt) {
      setTranscript("");
      transcriptRef.current = "";
      setMicState("recording");
      start();
      return;
    }

    startFallbackRecording();
  }, [cancelSpeech, setMicState, setTranscript, start, startFallbackRecording, stopPlayback, supported.stt]);

  const handleStopRecording = useCallback(() => {
    if (usingFallbackRef.current && recorderRef.current) {
      try {
        recorderRef.current.stop();
        setMicState("processing");
      } catch (error) {
        setMicState("idle");
      }
      return;
    }

    if (supported.stt) {
      setMicState("processing");
      stop();
    }
  }, [setMicState, stop, supported.stt]);

  const handleMicClick = useCallback(() => {
    if (micState === "processing" || isSending) {
      return;
    }

    if (micState === "recording") {
      handleStopRecording();
      return;
    }

    handleStartRecording();
  }, [handleStartRecording, handleStopRecording, isSending, micState]);

  const micLabel = useMemo(() => {
    if (micState === "recording") {
      return controlsCopy.stop || "Stop";
    }

    if (micState === "processing") {
      return controlsCopy.processing || "Processing";
    }

    return controlsCopy.start || "Start";
  }, [controlsCopy.processing, controlsCopy.start, controlsCopy.stop, micState]);

  const handleReplay = useCallback(() => {
    if (!lastAssistantReply) {
      return;
    }

    speakReply(lastAssistantReply);
  }, [lastAssistantReply, speakReply]);

  const handleReturnToChat = useCallback(() => {
    stopPlayback();
    cancelSpeech();

    if (usingFallbackRef.current && recorderRef.current) {
      try {
        recorderRef.current.stop();
      } catch (error) {
        // ignore stop errors on navigation
      }
      usingFallbackRef.current = false;
      recordedChunksRef.current = [];
    } else if (micState === "recording" && supported.stt) {
      stop();
    }

    setMicState("idle");
    setTranscript("");
    transcriptRef.current = "";
    navigate("/chat");
  }, [cancelSpeech, micState, navigate, setMicState, setTranscript, stop, stopPlayback, supported.stt]);

  const micIcon = micState === "recording" ? <FiSquare /> : <FiMic />;

  const renderMessage = (entry, index) => {
    const tone = entry?.meta?.triage ? "triage" : entry?.role;
    const key = entry?.id || entry?.timestamp || index;
    const bubbleClass =
      tone === "user"
        ? `${styles.voiceChat__bubble} ${styles.voiceChat__bubbleUser}`
        : tone === "triage"
        ? `${styles.voiceChat__bubble} ${styles.voiceChat__bubbleTriage}`
        : `${styles.voiceChat__bubble} ${styles.voiceChat__bubbleAssistant}`;

    return (
      <div key={key} className={bubbleClass}>
        <div className={styles.voiceChat__bubbleBody}>
          {entry?.meta?.triage && (
            <span className={styles.voiceChat__flag}>{pageCopy.triageFlag || "Important"}</span>
          )}
          <p>{entry?.content}</p>
        </div>
        <time className={styles.voiceChat__bubbleTime}>{formatTime(entry?.timestamp)}</time>
      </div>
    );
  };

  return (
    <main className={styles.voiceChat}>
      <header className={styles.voiceChat__header}>
        <div className={styles.voiceChat__nav}>
          <button
            type="button"
            className={styles.voiceChat__back}
            onClick={handleReturnToChat}
          >
            <FiArrowLeft aria-hidden="true" />
            {pageCopy.back || "Back"}
          </button>
        </div>

        <div className={styles.voiceChat__titleGroup}>
          <span>{pageCopy.title || "Voice Mode"}</span>
          <span className={styles.voiceChat__beta}>{pageCopy.betaTag || "Beta"}</span>
        </div>
      </header>

      <section ref={conversationRef} className={styles.voiceChat__conversation}>
        <div className={styles.voiceChat__bubbles}>
          {messages?.map(renderMessage)}

          {isSending && (
            <div className={`${styles.voiceChat__bubble} ${styles.voiceChat__bubbleAssistant}`}>
              <div className={styles.voiceChat__bubbleBody}>
                <div className={styles.voiceChat__typing} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className={styles.voiceChat__dock}>
        <div className={styles.voiceChat__statusWrap} aria-live="polite">
          {errorMessage ? (
            <p className={`${styles.voiceChat__status} ${styles.voiceChat__statusError}`}>
              {errorMessage}
            </p>
          ) : (
            <p className={styles.voiceChat__status}>{statusMessage}</p>
          )}
        </div>

        <div className={styles.voiceChat__micRow}>
          <button
            type="button"
            className={`${styles.voiceChat__micButton} ${
              micState === "recording" ? "recording" : ""
            } ${micState === "processing" ? "processing" : ""}`.trim()}
            onClick={handleMicClick}
            disabled={micState === "processing" || isSending}
          >
            {micState === "processing" ? (
              <FiLoader className={styles.voiceChat__spinner} aria-hidden="true" />
            ) : (
              micIcon
            )}
            <span>{micLabel}</span>
            {isSpeaking && <span aria-live="polite">•</span>}
          </button>

          <div className={styles.voiceChat__dockButtons}>
            <button
              type="button"
              className={styles.voiceChat__secondaryButton}
              onClick={handleReturnToChat}
            >
              <FiType aria-hidden="true" /> {controlsCopy.typeInstead || "Type instead"}
            </button>

            <button
              type="button"
              className={styles.voiceChat__secondaryButton}
              onClick={handleReplay}
              disabled={!lastAssistantReply}
            >
              <FiRotateCcw aria-hidden="true" /> {controlsCopy.replay || "Replay last reply"}
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default VoiceChat;
