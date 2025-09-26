import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiMic,
  FiMicOff,
  FiMoreHorizontal,
  FiSettings,
  FiShare2,
  FiType,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useChatMessages } from "../features/messages/hooks/useChatMessages.js";
import { useVoiceContext, VoiceUIStates } from "../state/voice/VoiceProvider.jsx";
import styles from "./voiceScreen.module.scss";

const VoiceScreen = () => {
  const navigate = useNavigate();
  const { messages } = useChatMessages();
  const {
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
    interrupt,
    latestTranscript,
    latestTranscriptId,
    activeUtteranceRef,
    lastSpokenRef,
    sendViaExisting,
    abortActiveRequest,
    resetTranscript,
  } = useVoiceContext();

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const statusAnnouncerRef = useRef(null);
  const hasUserGestureRef = useRef(false);
  const lastTranscriptTokenRef = useRef(null);
  const lastReplyLoggedRef = useRef(null);

  const statusIsSpeaking = speaking || isSending;
  const statusLabel = statusIsSpeaking ? "Assistant speaking" : listening ? "Listening" : "Idle";

  const statusDotClass = useMemo(() => {
    if (statusIsSpeaking) {
      return `${styles.statusDot} ${styles.statusDotSpeaking}`;
    }
    if (listening) {
      return `${styles.statusDot} ${styles.statusDotListening}`;
    }
    return styles.statusDot;
  }, [listening, statusIsSpeaking]);

  const orbClassName = useMemo(() => {
    const classNames = [styles.orb];

    if (listening) {
      classNames.push(styles.orbListening);
    }

    if (statusIsSpeaking) {
      classNames.push(styles.orbSpeaking);
    }

    if (prefersReducedMotion) {
      classNames.push(styles.orbReduceMotion);
    }

    return classNames.join(" ");
  }, [listening, prefersReducedMotion, statusIsSpeaking]);

  const micLabel = statusIsSpeaking
    ? "Tap to interrupt"
    : listening
    ? "Stop voice input"
    : "Start voice input";

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
      if (!statusAnnouncerRef.current) {
        return;
      }

      statusAnnouncerRef.current.textContent = "";
      queueAnimationFrame(() => {
        if (statusAnnouncerRef.current) {
          statusAnnouncerRef.current.textContent = message;
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

  const toggleListening = useCallback(() => {
    if (!canUseVoice) {
      return;
    }

    hasUserGestureRef.current = true;

    if (statusIsSpeaking) {
      const didInterrupt = interrupt({ resumeListening: true });
      if (didInterrupt) {
        announce("Interrupted");
        vibrate();
      }
      return;
    }

    if (listening) {
      stopListening();
      setUiState(VoiceUIStates.idle);
      announce("Listening stopped");
    } else {
      setUiState(VoiceUIStates.listening);
      startListening();
      announce("Listening started");
      vibrate();
    }
  }, [announce, canUseVoice, interrupt, listening, setUiState, startListening, statusIsSpeaking, stopListening, vibrate]);

  const handleBack = useCallback(() => {
    abortActiveRequest();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    navigate("/chat");
  }, [abortActiveRequest, navigate]);

  const handleMore = useCallback(() => {
    console.log("Voice options coming soon");
  }, []);

  const handleEnd = useCallback(() => {
    interrupt({ resumeListening: false });
    stopListening();
    abortActiveRequest();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setUiState(VoiceUIStates.idle);
    navigate("/chat");
  }, [abortActiveRequest, interrupt, navigate, setUiState, stopListening]);

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
    const token = latestTranscriptId;

    if (!token || token === lastTranscriptTokenRef.current) {
      return;
    }

    lastTranscriptTokenRef.current = token;

    const text = (latestTranscript || "").trim();

    if (!text) {
      resetTranscript();
      return;
    }

    const process = async () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      if (statusIsSpeaking) {
        abortActiveRequest();
        interrupt({ resumeListening: false });
      }

      resetTranscript();

      if (!listening) {
        setUiState(VoiceUIStates.listening);
      }

      startListening();

      console.log("[voice] sending:", text);

      try {
        const reply = await sendViaExisting(text, { fromVoice: true });

        if (reply && lastReplyLoggedRef.current?.token !== token) {
          lastReplyLoggedRef.current = { token, text: reply };
          console.log("[voice] reply:", reply);
        }
      } catch {
        lastReplyLoggedRef.current = null;
      }
    };

    void process();
  }, [
    abortActiveRequest,
    interrupt,
    latestTranscript,
    latestTranscriptId,
    listening,
    sendViaExisting,
    setUiState,
    startListening,
    statusIsSpeaking,
    resetTranscript,
  ]);

  useEffect(() => {
    if (!messages.length || !canSpeak) {
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

    if (!hasUserGestureRef.current) {
      return;
    }

    lastSpokenRef.current = messageKey;

    const replyText = latestAssistant.content;

    if (!replyText) {
      return;
    }

    if (!supportsFullDuplex) {
      stopListening();
    }

    console.log("[voice] speak:", replyText);

    activeUtteranceRef.current = speak(replyText, {
      rate: 0.96,
      pitch: 1,
      volume: 1,
      onStart: () => {
        setSpeaking(true);
        if (!supportsFullDuplex) {
          stopListening();
        }
      },
      onEnd: () => {
        setSpeaking(false);
        if (!supportsFullDuplex) {
          startListening();
        }
      },
    });
  }, [
    activeUtteranceRef,
    canSpeak,
    lastSpokenRef,
    messages,
    setSpeaking,
    speak,
    startListening,
    stopListening,
    supportsFullDuplex,
  ]);

  useEffect(() => {
    if (!messages.length) {
      lastSpokenRef.current = null;
    }
  }, [lastSpokenRef, messages.length]);

  useEffect(() => {
    if (voiceError) {
      announce(voiceError);
    }
  }, [announce, voiceError]);

  useEffect(() => {
    if (uiState === VoiceUIStates.listening) {
      announce("Listening…");
    } else if (uiState === VoiceUIStates.speaking) {
      announce("Speaking…");
    } else if (uiState === VoiceUIStates.sending) {
      announce("Thinking…");
    }
  }, [announce, uiState]);

  const statusChip = useMemo(() => {
    if (statusIsSpeaking) {
      return "Speaking…";
    }

    if (uiState === VoiceUIStates.sending) {
      return "Thinking…";
    }

    if (listening) {
      return "Listening…";
    }

    return "Idle";
  }, [listening, statusIsSpeaking, uiState]);

  const captionText = latestTranscript || (listening ? "Listening…" : "Tap the mic to start");

  return (
    <div className={styles.voiceScreen} role="application" aria-label="Voice conversation mode">
      <header className={styles.topBar}>
        <button type="button" className={styles.iconButton} onClick={handleBack} aria-label="Back to chat">
          <FiArrowLeft aria-hidden="true" size={22} />
        </button>
        <div className={styles.statusGroup}>
          <span className={statusDotClass} aria-hidden="true" />
          <span className={styles.statusLabel}>{statusLabel}</span>
          <span className={styles.statusChip}>{statusChip}</span>
        </div>
        <div className={styles.topActions}>
          <button type="button" className={styles.iconButton} aria-label="Captions" onClick={() => {}}>
            <FiType aria-hidden="true" size={18} />
          </button>
          <button type="button" className={styles.iconButton} aria-label="Share" onClick={() => {}}>
            <FiShare2 aria-hidden="true" size={18} />
          </button>
          <button type="button" className={styles.iconButton} aria-label="Settings" onClick={() => {}}>
            <FiSettings aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      <main className={styles.body}>
        <div className={styles.captionArea} aria-live="polite" aria-atomic="true">
          <span>{captionText}</span>
        </div>
        <div className={styles.orbWrapper}>
          <div className={orbClassName} />
        </div>
        {voiceError && (
          <div className={styles.voiceError} role="status" aria-live="polite">
            {voiceError}
          </div>
        )}
      </main>

      <footer className={styles.controls}>
        <div className={styles.bottomActions}>
          <button type="button" className={styles.controlButton} onClick={handleBack} aria-label="Back to chat">
            <FiArrowLeft aria-hidden="true" size={22} />
          </button>
          <button
            type="button"
            className={`${styles.controlButton} ${listening ? styles.controlButtonActive : ""}`.trim()}
            onClick={toggleListening}
            aria-label={micLabel}
            aria-pressed={listening}
            disabled={!canUseVoice}
          >
            {statusIsSpeaking || listening ? (
              <FiMicOff aria-hidden="true" size={22} />
            ) : (
              <FiMic aria-hidden="true" size={22} />
            )}
          </button>
          <button type="button" className={styles.controlButton} onClick={handleMore} aria-label="More options">
            <FiMoreHorizontal aria-hidden="true" size={22} />
          </button>
          <button type="button" className={styles.controlButton} onClick={handleEnd} aria-label="End voice session">
            <FiX aria-hidden="true" size={22} />
          </button>
        </div>
      </footer>

      <span className={styles.statusAnnouncer} ref={statusAnnouncerRef} aria-live="polite" aria-atomic="true" />
    </div>
  );
};

export default VoiceScreen;
