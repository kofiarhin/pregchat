import React, { useCallback, useEffect, useRef, useState } from "react";
import { FiMenu, FiMic, FiMicOff, FiPlay, FiPlus } from "react-icons/fi";
import { http } from "../../api/http.js";
import { useChatMessages } from "../../features/messages/hooks/useChatMessages.js";
import useVoiceChat from "../../hooks/useVoiceChat.js";
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
  const scrollAnchorRef = useRef(null);
  const inputRef = useRef(null);
  const lastSpokenRef = useRef(null);
  const voiceQueueRef = useRef([]);

  const {
    canListen,
    canSpeak,
    isListening,
    lastTranscript,
    resetTranscript,
    speak,
    startListening,
    stopListening,
  } = useVoiceChat();

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

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

        const data = await http.post("/chat/ask", { json: payload });
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
        await appendMessages({
          id: genId(),
          role: "assistant",
          content: error?.message || "Failed to send message.",
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsSending(false);
        if (!fromVoice) {
          inputRef.current?.focus();
        }
      }
    },
    [appendMessages, daySummary, isSending]
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      inputRef.current?.focus();
      void sendMessage(input);
    },
    [input, sendMessage]
  );

  const toggleMic = useCallback(() => {
    if (!canListen) {
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [canListen, isListening, startListening, stopListening]);

  const handleReplay = useCallback(
    (message) => {
      if (!message?.content) {
        return;
      }

      speak(message.content, { rate: 0.96, pitch: 1, volume: 1 });
    },
    [speak]
  );

  useEffect(() => {
    if (!lastTranscript) {
      return;
    }

    void sendMessage(lastTranscript, { fromVoice: true });
    resetTranscript();
  }, [lastTranscript, resetTranscript, sendMessage]);

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
    if (!messages.length || !canSpeak) {
      return;
    }

    const latestAssistant = [...messages]
      .reverse()
      .find((message) => message?.role === "assistant" && message?.content);

    if (!latestAssistant) {
      return;
    }

    const key = latestAssistant.id || latestAssistant.timestamp || latestAssistant.content;

    if (lastSpokenRef.current === key) {
      return;
    }

    lastSpokenRef.current = key;
    speak(latestAssistant.content, { rate: 0.96, pitch: 1, volume: 1 });
  }, [messages, speak, canSpeak]);

  useEffect(() => {
    if (!messages.length) {
      lastSpokenRef.current = null;
    }
  }, [messages.length]);

  const renderMessage = useCallback(
    (entry, index) => {
      const isUser = entry?.role === "user";
      const triage = entry?.meta?.triage;
      const rowClass = `${styles.messageRow} ${isUser ? styles.user : styles.assistant}`;
      const bubbleClass = `${styles.bubble} ${isUser ? styles.userBubble : ""}`;
      const key = entry?.id || entry?.timestamp || index;

      return (
        <div key={key} className={rowClass}>
          <div className={bubbleClass}>
            {triage && <span className={styles.triageLabel}>Important</span>}
            <div>{entry?.content}</div>
            {!isUser && (
              <div className={styles.messageActions}>
                <button
                  type="button"
                  className={styles.playButton}
                  onClick={() => handleReplay(entry)}
                  aria-label="Replay response"
                  disabled={!canSpeak}
                >
                  <FiPlay aria-hidden="true" size={18} />
                </button>
              </div>
            )}
          </div>
          <time className={styles.time}>{formatTime(entry?.timestamp)}</time>
        </div>
      );
    },
    [canSpeak, handleReplay]
  );

  return (
    <div className={styles.chat}>
      <header className={styles.header}>
        <button type="button" className={styles.headerButton} aria-label="Open menu">
          <FiMenu aria-hidden="true" size={20} />
        </button>
        <h1 className={styles.title}>ChatGPT 5</h1>
        <div className={styles.statusWrapper} aria-label="Online">
          <span className={styles.statusDot} />
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
            className={`${styles.roundButton} ${isListening ? styles.micActive : ""}`}
            onClick={toggleMic}
            aria-pressed={isListening}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            disabled={!canListen}
          >
            {isListening ? (
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
    </div>
  );
};

export default ChatBox;
