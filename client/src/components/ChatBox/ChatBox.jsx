import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiMenu, FiMic, FiMicOff, FiPlay, FiPlus, FiMaximize2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useChatMessages } from "../../features/messages/hooks/useChatMessages.js";
import { useVoiceContext, VoiceUIStates } from "../../state/voice/VoiceProvider.jsx";
import styles from "../Chat/chat.module.scss";

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

const ChatBox = () => {
  const { messages } = useChatMessages();
  const [input, setInput] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const scrollAnchorRef = useRef(null);
  const inputRef = useRef(null);
  const liveRegionRef = useRef(null);
  const navigate = useNavigate();

  const {
    canUseVoice,
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
    activeUtteranceRef,
    lastSpokenRef,
  } = useVoiceContext();

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
      const didInterrupt = interrupt({ resumeListening });

      if (didInterrupt) {
        setSpeakingMessageId(null);
      }

      if (didInterrupt && announceInterrupt) {
        announce("Interrupted");
        vibrate();
      }
    },
    [announce, interrupt, setSpeakingMessageId, vibrate]
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const trimmed = input.trim();

      if (!trimmed) {
        return;
      }

      setInput("");
      inputRef.current?.focus();
      void sendViaExisting(trimmed);
    },
    [input, sendViaExisting]
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
    [setSpeaking, setSpeakingMessageId, speak, startListening, stopListening, supportsFullDuplex]
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
      setUiState(VoiceUIStates.idle);
    } else {
      setUiState(VoiceUIStates.listening);
      startListening();
    }
  }, [canUseVoice, handleInterrupt, listening, setUiState, startListening, statusIsSpeaking, stopListening]);

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
  }, [canUseVoice, messages, setSpeaking, setSpeakingMessageId, speak, startListening, stopListening, supportsFullDuplex]);

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
    setUiState((previous) => (previous === VoiceUIStates.listening ? VoiceUIStates.idle : previous));
  }, [setUiState, voiceError]);

  useEffect(() => {
    if (listening) {
      setVoiceNotice(null);
      setUiState((previous) =>
        previous === VoiceUIStates.sending || previous === VoiceUIStates.speaking
          ? previous
          : VoiceUIStates.listening
      );
      announce("Listening started");
      vibrate();
    } else if (uiState === VoiceUIStates.listening) {
      setUiState(speaking ? VoiceUIStates.speaking : VoiceUIStates.idle);
      announce("Listening stopped");
    }
  }, [announce, listening, setUiState, speaking, uiState, vibrate]);

  useEffect(() => {
    if (speaking) {
      setUiState(VoiceUIStates.speaking);
      announce("Speaking…");
    } else if (!listening && !isSending) {
      setUiState(VoiceUIStates.idle);
    }
  }, [announce, isSending, listening, setUiState, speaking]);

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
              type="button"
              className={styles.roundButton}
              onClick={() => navigate("/voice")}
              aria-label="Open voice screen"
            >
              <FiMaximize2 aria-hidden="true" size={20} />
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
