import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { http } from "../../api/http.js";
import { useChatMessages } from "../../features/messages/hooks/useChatMessages.js";
import { useTodayPregnancyQuery } from "../../features/pregnancy/hooks/usePregnancy.js";
import useVoiceChat from "../../hooks/useVoiceChat.js";

export const VoiceUIStates = {
  idle: "idle",
  listening: "listening",
  sending: "sending",
  speaking: "speaking",
  interrupting: "interrupting",
};

const VoiceContext = createContext(null);

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const VoiceProvider = ({ children }) => {
  const { appendMessages } = useChatMessages();
  const { data: daySummary } = useTodayPregnancyQuery({ enabled: true });

  const {
    canUseVoice,
    canSpeak,
    listening,
    startListening,
    stopListening,
    speak,
    lastTranscript: recognitionTranscript,
    resetTranscript,
    supportsFullDuplex,
    voiceError,
  } = useVoiceChat();

  const [uiState, setUiState] = useState(VoiceUIStates.idle);
  const [speaking, setSpeaking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(0);
  const [latestTranscript, setLatestTranscript] = useState("");
  const [latestTranscriptId, setLatestTranscriptId] = useState(0);

  const listeningRef = useRef(listening);
  const speakingRef = useRef(speaking);
  const sendingRef = useRef(isSending);
  const abortControllerRef = useRef(null);
  const requestCounterRef = useRef(0);
  const currentRequestIdRef = useRef(0);
  const voiceQueueRef = useRef([]);
  const activeUtteranceRef = useRef(null);
  const lastSpokenRef = useRef(null);

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);

  useEffect(() => {
    sendingRef.current = isSending;
  }, [isSending]);

  const clearAbortController = useCallback(() => {
    abortControllerRef.current = null;
  }, []);

  const clearLatestTranscript = useCallback(() => {
    setLatestTranscript("");
    setLatestTranscriptId(0);
  }, []);

  const abortActiveRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    currentRequestIdRef.current = 0;
    setCurrentRequestId(0);
  }, []);

  const interrupt = useCallback(
    ({ resumeListening = false } = {}) => {
      let interrupted = false;

      setUiState(VoiceUIStates.interrupting);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        interrupted = true;
      }

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        interrupted = true;
      }

      if (activeUtteranceRef.current) {
        activeUtteranceRef.current = null;
      }

      setIsSending(false);
      sendingRef.current = false;
      setSpeaking(false);

      if (resumeListening) {
        setUiState(VoiceUIStates.listening);
        startListening();
      } else if (listeningRef.current) {
        setUiState(VoiceUIStates.listening);
      } else if (!speakingRef.current) {
        setUiState(VoiceUIStates.idle);
      }

      return interrupted;
    },
    [startListening]
  );

  const sendViaExisting = useCallback(
    async function sendViaExistingInner(rawText, options = {}) {
      const { fromVoice = false } = options;
      const trimmed = typeof rawText === "string" ? rawText.trim() : "";

      if (!trimmed) {
        return;
      }

      if (sendingRef.current) {
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

      await appendMessages(userMessage);

      setIsSending(true);
      sendingRef.current = true;
      setUiState(VoiceUIStates.sending);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const nextRequestId = requestCounterRef.current + 1;
      requestCounterRef.current = nextRequestId;
      currentRequestIdRef.current = nextRequestId;
      setCurrentRequestId(nextRequestId);

      try {
        const payload = { text: trimmed };

        if (daySummary) {
          payload.dayData = {
            dayIndex: daySummary.day,
            babyUpdate: daySummary.babyUpdate,
            momUpdate: daySummary.momUpdate,
            tips: daySummary.tips,
          };
        }

        const data = await http.post("/chat/ask", {
          json: payload,
          signal: abortController.signal,
        });

        if (currentRequestIdRef.current !== nextRequestId) {
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
        return assistantContent;
      } catch (error) {
        if (error?.name === "AbortError") {
          return null;
        }

        await appendMessages({
          id: genId(),
          role: "assistant",
          content: error?.message || "Failed to send message.",
          timestamp: new Date().toISOString(),
        });
        return null;
      } finally {
        if (currentRequestIdRef.current === nextRequestId) {
          clearAbortController();
          currentRequestIdRef.current = 0;
          setCurrentRequestId(0);
          setIsSending(false);
          sendingRef.current = false;

          if (listeningRef.current) {
            setUiState(VoiceUIStates.listening);
          } else if (!speakingRef.current) {
            setUiState(VoiceUIStates.idle);
          }

          const nextQueued = voiceQueueRef.current.shift();

          if (nextQueued) {
            const schedule = () =>
              sendViaExistingInner(nextQueued, { fromVoice: true });

            if (typeof window !== "undefined" && window.setTimeout) {
              window.setTimeout(schedule, 0);
            } else {
              schedule();
            }
          }
        }
      }
    },
    [appendMessages, clearAbortController, daySummary]
  );

  useEffect(() => {
    if (!recognitionTranscript) {
      return;
    }

    const trimmed = recognitionTranscript.trim();

    if (!trimmed) {
      resetTranscript();
      return;
    }

    setLatestTranscript(trimmed);
    setLatestTranscriptId((previous) => previous + 1);
    resetTranscript();
  }, [recognitionTranscript, resetTranscript]);

  useEffect(() => {
    if (listening) {
      setUiState((previous) => {
        if (previous === VoiceUIStates.sending || previous === VoiceUIStates.speaking) {
          return previous;
        }
        return VoiceUIStates.listening;
      });
    } else if (!sendingRef.current && !speakingRef.current) {
      setUiState(VoiceUIStates.idle);
    }
  }, [listening]);

  useEffect(() => {
    if (speaking) {
      setUiState(VoiceUIStates.speaking);
    } else if (!listeningRef.current && !sendingRef.current) {
      setUiState(VoiceUIStates.idle);
    }
  }, [speaking]);

  const value = useMemo(
    () => ({
      canUseVoice,
      canSpeak,
      listening,
      startListening,
      stopListening,
      speak,
      supportsFullDuplex,
      voiceError,
      uiState,
      setUiState,
      speaking,
      setSpeaking,
      isSending,
      sendViaExisting,
      interrupt,
      abortActiveRequest,
      currentRequestId,
      latestTranscript,
      latestTranscriptId,
      resetTranscript,
      activeUtteranceRef,
      lastSpokenRef,
      clearLatestTranscript,
    }),
    [
      abortActiveRequest,
      canUseVoice,
      canSpeak,
      currentRequestId,
      interrupt,
      isSending,
      latestTranscript,
      latestTranscriptId,
      listening,
      setUiState,
      speak,
      speaking,
      startListening,
      stopListening,
      supportsFullDuplex,
      uiState,
      sendViaExisting,
      setSpeaking,
      clearLatestTranscript,
      voiceError,
    ]
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};

export const useVoiceContext = () => {
  const context = useContext(VoiceContext);

  if (!context) {
    throw new Error("useVoiceContext must be used within a VoiceProvider");
  }

  return context;
};

export default VoiceProvider;
