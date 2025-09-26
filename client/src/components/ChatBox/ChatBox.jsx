import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiMenu, FiMic, FiMicOff, FiPlay, FiPlus } from "react-icons/fi";
import { http } from "../../api/http.js";
import { useChatMessages } from "../../features/messages/hooks/useChatMessages.js";
import useVoiceChat from "../../hooks/useVoiceChat.js";
import styles from "../Chat/chat.module.scss";

const UI_STATES = {
  idle: "idle",
  listening: "listening",
  sending: "sending",
  speaking: "speaking",
  interrupting: "interrupting",
};

const formatTime = (value) => {
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const WaveIcon = (props) => (
  <svg
    aria-hidden="true"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3 12c2.4 0 2.4-6 4.8-6s2.4 12 4.8 12 2.4-12 4.8-12 2.4 6 4.8 6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChatBox = ({ daySummary }) => {
  const { messages, appendMessages } = useChatMessages();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [uiState, setUiState] = useState(UI_STATES.idle);
  const [speaking, setSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const scrollAnchorRef = useRef(null);
  const inputRef = useRef(null);
  const lastSpokenRef = useRef(null);
  const voiceQueueRef = useRef([]);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const currentRequestIdRef = useRef(0);
  const liveRegionRef = useRef(null);
  const activeUtteranceRef = useRef(null);

  const {
    canUseVoice,
    listening,
    startListening,
    stopListening,
    speak,
    lastTranscript,
    resetTranscript,
    supportsFullDuplex,
    voiceError,
  } = useVoiceChat();

  const statusIsSpeaking = speaking || isSending;
  const statusDotClass = `${styles.statusDot} ${
    statusIsSpeaking ? styles.statusDotSpeaking : listening ? styles.statusDotListening : ""
  }`;
  const statusLabel = statusIsSpeaking ? "Assistant speaking" : listening ? "Listening" : "Idle";

  const micLabel = statusIsSpeaking
    ? "Tap to interrupt"
    : listening
    ? "Stop voice input"
    : "Start voice input";

  const micClasses = useMemo(() => {
    const classNames = [styles.roundButton];

    if (listening) {
      classNames.push(styles.micActive);
    }

    if (statusIsSpeaking) {
      classNames.push(styles.micInterrupt);
    }

    return classNames.join(" ");
  }, [listening, statusIsSpeaking]);

  const queueAnimationFrame = useCallback((callback) => {
    if (typeof window === "undefined") {
      callback();
      return;
    }

    const raf = window.requestAnimationFrame || window.setTimeout;
    raf(() => callback());
  }, []);

  const announce = useCallback(
    (message) => {
      if (!liveRegionRef.current) {
        return;
      }

      liveRegionRef.current.textContent = "";
      queueAnimationFrame(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = message;
        }
      });
    },
    [queueAnimationFrame]
  );

  const vibrate = useCallback(() => {
    if (prefersReducedMotion) {
      return;
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  }, [prefersReducedMotion]);

  const handleInterrupt = useCallback(
    ({ resumeListening = false, announceInterrupt = true } = {}) => {
      let didInterrupt = false;

      setUiState(UI_STATES.interrupting);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        didInterrupt = true;
      }

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        didInterrupt = true;
      }

      if (activeUtteranceRef.current) {
        activeUtteranceRef.current = null;
      }

      if (didInterrupt && announceInterrupt) {
        announce("Interrupted");
        vibrate();
      }

      setSpeaking(false);
      setSpeakingMessageId(null);
      setIsSending(false);

      if (resumeListening) {
        setUiState(UI_STATES.listening);
        startListening();
      } else if (!listening) {
        setUiState(UI_STATES.idle);
      }
    },
    [announce, vibrate, listening, startListening]
  );

  const sendMessage = useCallback(
    async (text, { fromVoice = false } = {}) => {
      const trimmed = text.trim();

      if (!trimmed) {
        return;
      }

      if (isSending) {
        if (fromVoice) {
          voiceQueueRef.current.push(trimmed);
        }
        return;
      }

      const userMessage = {
        id: genId(),
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      if (!fromVoice) {
        setInput("");
      }

      await appendMessages(userMessage);
      setIsSending(true);
      setVoiceNotice(null);
      setUiState(UI_STATES.sending);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const nextRequestId = requestIdRef.current + 1;
      requestIdRef.current = nextRequestId;
      currentRequestIdRef.current = nextRequestId;

      try {
        const payload = {
          text: trimmed,
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

        const data = await http.post("/chat/ask", { json: payload, signal: abortController.signal });

        if (nextRequestId !== currentRequestIdRef.current) {
          return;
        }

        const assistantContent =
          data?.content ||
          data?.message ||
          "I'm not sure how to respond right now, but I'm here for you.";

        const assistantMessage = {
          id: genId(),
          role: "assistant",
          content: assistantContent,
          timestamp: new Date().toISOString(),
          meta: data?.triage ? { triage: true } : undefined,
        };

        await appendMessages(assistantMessage);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        await appendMessages({
          id: genId(),
          role: "assistant",
          content: error?.message || "Failed to send message.",
          timestamp: new Date().toISOString(),
        });
      } finally {
        if (nextRequestId === currentRequestIdRef.current) {
          setIsSending(false);
          abortControllerRef.current = null;
          if (!fromVoice) {
            inputRef.current?.focus();
          }

          if (listening) {
            setUiState(UI_STATES.listening);
          } else if (!speaking) {
            setUiState(UI_STATES.idle);
          }
        }
      }
    },
    [appendMessages, daySummary, isSending, listening, speaking]
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      inputRef.current?.focus();
      void sendMessage(input);
    },
    [input, sendMessage]
  );

  const handleReplay = useCallback(
    (message) => {
      if (!message?.content) {
        return;
      }

      speak(message.content, {
        rate: 0.96,
        pitch: 1,
        volume: 1,
        onStart: () => {
          setSpeaking(true);
          setSpeakingMessageId(message.id || message.timestamp || message.content);
          if (!supportsFullDuplex) {
            stopListening();
          }
        },
        onEnd: () => {
          setSpeaking(false);
          setSpeakingMessageId(null);
          if (!supportsFullDuplex) {
            startListening();
          }
        },
      });
    },
    [speak, startListening, stopListening, supportsFullDuplex]
  );

  const handleMicPress = useCallback(() => {
    if (!canUseVoice) {
      return;
    }

    if (statusIsSpeaking) {
      handleInterrupt({ resumeListening: true });
      return;
    }

    if (listening) {
      stopListening();
      setUiState(UI_STATES.idle);
    } else {
      setUiState(UI_STATES.listening);
      startListening();
    }
  }, [canUseVoice, handleInterrupt, listening, startListening, statusIsSpeaking, stopListening]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event) => setPrefersReducedMotion(event.matches);

    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

  useEffect(() => {
    if (!lastTranscript) {
      return;
    }

    const trimmed = lastTranscript.trim();

    if (!trimmed) {
      resetTranscript();
      return;
    }

    if (statusIsSpeaking) {
      handleInterrupt({ resumeListening: false });
    }

    void sendMessage(trimmed, { fromVoice: true });
    resetTranscript();
  }, [handleInterrupt, lastTranscript, resetTranscript, sendMessage, statusIsSpeaking]);

  useEffect(() => {
    if (isSending) {
      return;
    }

    const nextQueued = voiceQueueRef.current.shift();

    if (nextQueued) {
      void sendMessage(nextQueued, { fromVoice: true });
    }
  }, [isSending, sendMessage]);

  useEffect(() => {
    if (!messages.length || !canUseVoice) {
      return;
    }

    const latestAssistant = [...messages]
      .reverse()
      .find((message) => message?.role === "assistant" && message?.content);

    if (!latestAssistant) {
      return;
    }

    const messageKey = latestAssistant.id || latestAssistant.timestamp || latestAssistant.content;

    if (lastSpokenRef.current === messageKey) {
      return;
    }

    lastSpokenRef.current = messageKey;

    activeUtteranceRef.current = speak(latestAssistant.content, {
      rate: 0.96,
      pitch: 1,
      volume: 1,
      onStart: () => {
        setSpeaking(true);
        setSpeakingMessageId(messageKey);
        if (!supportsFullDuplex) {
          stopListening();
        }
      },
      onEnd: () => {
        setSpeaking(false);
        setSpeakingMessageId(null);
        if (!supportsFullDuplex) {
          startListening();
        }
      },
    });
  }, [canUseVoice, messages, speak, startListening, stopListening, supportsFullDuplex]);

  useEffect(() => {
    if (!messages.length) {
      lastSpokenRef.current = null;
    }
  }, [messages.length]);

  useEffect(() => {
    if (!voiceError) {
      return;
    }

    setVoiceNotice(voiceError);
    setUiState((previous) => (previous === UI_STATES.listening ? UI_STATES.idle : previous));
  }, [voiceError]);

  useEffect(() => {
    if (listening) {
      setVoiceNotice(null);
      setUiState((previous) =>
        previous === UI_STATES.sending || previous === UI_STATES.speaking
          ? previous
          : UI_STATES.listening
      );
      announce("Listening started");
      vibrate();
    } else if (uiState === UI_STATES.listening) {
      setUiState(speaking ? UI_STATES.speaking : UI_STATES.idle);
      announce("Listening stopped");
    }
  }, [announce, listening, speaking, uiState, vibrate]);

  useEffect(() => {
    if (speaking) {
      setUiState(UI_STATES.speaking);
      announce("Speaking…");
    } else if (!listening && !isSending) {
      setUiState(UI_STATES.idle);
    }
  }, [announce, isSending, listening, speaking]);

  const renderMessage = useCallback(
    (entry, index) => {
      const isUser = entry?.role === "user";
      const triage = entry?.meta?.triage;
      const messageId = entry?.id || entry?.timestamp || index;
      const rowClass = `${styles.messageRow} ${isUser ? styles.user : styles.assistant}`;
      const bubbleClass = `${styles.bubble} ${isUser ? styles.userBubble : ""}`;

      return (
        <div key={messageId} className={rowClass}>
          <div className={bubbleClass}>
            {triage && <span className={styles.triageLabel}>Important</span>}
            <div>{entry?.content}</div>
            {!isUser && (
              <>
                <div className={styles.messageActions}>
                  <button
                    type="button"
                    className={styles.playButton}
                    onClick={() => handleReplay(entry)}
                    aria-label="Replay response"
                    disabled={!canUseVoice}
                  >
                    <FiPlay aria-hidden="true" size={18} />
                  </button>
                </div>
                {speaking && speakingMessageId === messageId && (
                  <div className={styles.speakingIndicator} aria-label="Assistant is speaking">
                    <span className={styles.speakingWave} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                    <span>Speaking…</span>
                  </div>
                )}
              </>
            )}
          </div>
          <time className={styles.time}>{formatTime(entry?.timestamp)}</time>
        </div>
      );
    },
    [canUseVoice, handleReplay, speaking, speakingMessageId]
  );

  return (
    <div className={styles.chat}>
      <header className={styles.header}>
        <button type="button" className={styles.headerButton} aria-label="Open menu">
          <FiMenu aria-hidden="true" size={20} />
        </button>
        <h1 className={styles.title}>ChatGPT 5</h1>
        <div className={styles.statusWrapper} aria-label={statusLabel} role="status">
          <span className={statusDotClass} />
        </div>
      </header>

      <main className={styles.messages}>
        {messages.map(renderMessage)}

        {isSending && (
          <div className={`${styles.messageRow} ${styles.assistant}`}>
            <div className={styles.bubble}>
              <div className={styles.typing}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={scrollAnchorRef} />
      </main>

      <div className={styles.composerShell}>
        {listening && (
          <div className={styles.listeningChip} role="status" aria-live="polite">
            <span className={styles.listeningGlow} aria-hidden="true" />
            Listening…
          </div>
        )}

        <form className={styles.composer} onSubmit={handleSubmit}>
          <div className={styles.composerRow}>
            <button type="button" className={styles.roundButton} aria-label="Add prompt">
              <FiPlus aria-hidden="true" size={22} />
            </button>

            <div className={styles.inputWrapper}>
              <input
                ref={inputRef}
                className={styles.input}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything"
                disabled={isSending}
                autoFocus
              />
            </div>

            <button
              type="button"
              className={micClasses}
              onClick={handleMicPress}
              aria-pressed={listening}
              aria-label={micLabel}
              disabled={!canUseVoice}
            >
              {listening || statusIsSpeaking ? (
                <FiMicOff aria-hidden="true" size={22} />
              ) : (
                <FiMic aria-hidden="true" size={22} />
              )}
            </button>

            <button
              className={styles.roundButton}
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || isSending}
            >
              <WaveIcon />
            </button>
          </div>
        </form>

        {voiceNotice && (
          <div className={styles.notice} role="status" aria-live="polite">
            {voiceNotice}
          </div>
        )}
      </div>

      <span className={styles.liveRegion} ref={liveRegionRef} aria-live="polite" aria-atomic="true" />
    </div>
  );
};

export default ChatBox;
