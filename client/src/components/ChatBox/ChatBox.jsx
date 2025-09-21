// ChatBox.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAsk } from "../../hooks/useChat";
import { useAppSelector } from "../../store/store";
import "./chatBox.styles.scss";

const ChatBox = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false); // network request in-flight
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("aya_theme");
    return saved ? saved === "dark" : true;
  });
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Typewriter state
  const [typingMsgId, setTypingMsgId] = useState(null);
  const [typingText, setTypingText] = useState("");
  const typeIntervalRef = useRef(null);

  const messagesRef = useRef(null);
  const endRef = useRef(null);
  const lastMsgRef = useRef(null);

  const { user } = useAppSelector((s) => s.auth);
  const { dayIndex } = useAppSelector((s) => s.pregnancy);
  const askMutation = useAsk();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    lastMsgRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [chatHistory, isTyping, typingText]);

  useEffect(() => {
    localStorage.setItem("aya_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    return () => {
      if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
    };
  }, []);

  const handleScroll = () => {
    if (!messagesRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setShowScrollBtn(!atBottom);
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!typingMsgId) return;
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);

    const msg = chatHistory.find((m) => m.id === typingMsgId);
    if (!msg || !msg.content) return;

    const full = msg.content;
    setTypingText("");

    const targetMs = 2000;
    const step = Math.max(10, Math.floor(targetMs / Math.max(1, full.length)));
    let i = 0;

    typeIntervalRef.current = setInterval(() => {
      i += 1;
      setTypingText(full.slice(0, i));
      lastMsgRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      if (i >= full.length) {
        clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = null;
        setTypingMsgId(null);
      }
    }, step);
  }, [typingMsgId, chatHistory]);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;

    const text = message.trim();
    setMessage("");
    setIsTyping(true);

    setChatHistory((prev) => [
      ...prev,
      { id: Date.now(), type: "user", content: text, timestamp: new Date() },
    ]);

    try {
      const dayData = dayIndex
        ? { dayIndex, babyUpdate: "", momUpdate: "", tips: "" }
        : null;

      const res = await askMutation.mutateAsync({
        text,
        dayData,
        stream: false,
      });

      const newMsg = res.triage
        ? {
            id: Date.now() + 1,
            type: "triage",
            content: res.message,
            timestamp: new Date(),
          }
        : {
            id: Date.now() + 1,
            type: "assistant",
            content: res.content,
            timestamp: new Date(),
          };

      setChatHistory((prev) => [...prev, newMsg]);

      if (!res.triage) {
        setTypingMsgId(newMsg.id);
        setTypingText("");
      } else {
        if (typeIntervalRef.current) {
          clearInterval(typeIntervalRef.current);
          typeIntervalRef.current = null;
        }
        setTypingMsgId(null);
        setTypingText("");
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "error",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = null;
      }
      setTypingMsgId(null);
      setTypingText("");
    } finally {
      setIsTyping(false);
    }
  };

  const t = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fill = (v) => setMessage(v);

  return (
    <div className={`container ${dark ? "dark" : "light"}`}>
      <header className="topbar">
        <button className="menu" type="button" aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
        <div className="title">
          <span className="brand">Aya</span>
          <span className="model">Pregnancy 2.5</span>
        </div>
        <div className="actions">
          <button
            className="toggle"
            type="button"
            onClick={() => setDark((v) => !v)}
            aria-label="Toggle theme"
          >
            {dark ? "🌞" : "🌙"}
          </button>
          <div className="avatar">{user?.name?.[0]?.toUpperCase() || "A"}</div>
        </div>
      </header>

      <main className="messages" ref={messagesRef} onScroll={handleScroll}>
        {chatHistory.length === 0 && (
          <section className="welcome">
            <h1 className="headline">
              Hello, {user?.name?.split(" ")[0] || "there"}
            </h1>
            <div className="chips">
              <button
                className="chip"
                onClick={() =>
                  fill(
                    `What should I know today about week ${
                      dayIndex ? Math.ceil(dayIndex / 7) : "X"
                    }?`
                  )
                }
              >
                Inspire me
              </button>
              <button
                className="chip"
                onClick={() =>
                  fill("Give me a quick wellness checklist for today.")
                }
              >
                Save me time
              </button>
              <button
                className="chip"
                onClick={() => fill("What can you do for pregnancy support?")}
              >
                What you can do
              </button>
            </div>
          </section>
        )}

        {chatHistory.map((m, idx) => {
          const isLast = idx === chatHistory.length - 1;
          const isAnimating = m.id === typingMsgId && m.type === "assistant";
          const displayText = isAnimating ? typingText : m.content;

          return (
            <div
              key={m.id}
              className={`bubble bubble--${m.type}`}
              ref={isLast ? lastMsgRef : null}
            >
              <div className={`body ${isAnimating ? "typewriter" : ""}`}>
                {m.type === "triage" && (
                  <div className="flag">⚠️ Important</div>
                )}
                <p>
                  {displayText}
                  {isAnimating && <span className="caret" />}
                </p>
              </div>
              <time className="time">{t(m.timestamp)}</time>
            </div>
          );
        })}

        {isTyping && (
          <div className="bubble bubble--assistant" ref={lastMsgRef}>
            <div className="body">
              <div className="typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </main>

      <button
        className={`scroll-btn ${showScrollBtn ? "show" : ""}`}
        onClick={scrollToBottom}
        aria-label="Scroll to latest"
      >
        ↓
      </button>

      <form className="composer" onSubmit={submit}>
        <div className="wrap">
          <div className="field">
            <input
              className="input"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Aya about your pregnancy…"
              disabled={isTyping}
            />
            <button
              className="send"
              type="submit"
              disabled={!message.trim() || isTyping}
            >
              {isTyping ? "…" : "➤"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
