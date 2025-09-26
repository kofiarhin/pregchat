import React, { useEffect, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import { http } from "../../api/http.js";
import "./chatBox.styles.scss";
import { useChatMessages } from "../../features/messages/hooks/useChatMessages.js";

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

const ChatBox = ({ daySummary }) => {
  const { messages, appendMessages } = useChatMessages();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollAnchorRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    inputRef.current?.focus();
    const text = input.trim();
    if (!text || isSending) return;

    const userMessage = {
      id: genId(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    await appendMessages(userMessage);
    setInput("");
    setIsSending(true);

    try {
      const payload = {
        text,
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
      inputRef.current?.focus();
    }
  };

  const renderMessage = (entry) => {
    const tone = entry.meta?.triage ? "triage" : entry.role;
    return (
      <div key={entry.id} className={`bubble bubble--${tone ?? "assistant"}`}>
        <div className="body">
          {entry.meta?.triage && <div className="flag">Important</div>}
          <p>{entry.content}</p>
        </div>
        <time className="time">{formatTime(entry.timestamp)}</time>
      </div>
    );
  };

  return (
    <div className="container dark">
      <main className="messages">
        {messages.map(renderMessage)}

        {isSending && (
          <div className="bubble bubble--assistant">
            <div className="body">
              <div className="typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={scrollAnchorRef} />
      </main>

      <form className="composer" onSubmit={handleSubmit}>
        <div className="wrap">
          <div className="field">
            <input
              className="input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Aya about your pregnancy..."
              disabled={isSending}
              ref={inputRef}
              autoFocus
            />
            <button
              className="send"
              type="submit"
              aria-label="Send message"
              title="Send message"
              disabled={!input.trim() || isSending}
            >
              <FiSend aria-hidden="true" size={20} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
