// ChatBox.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAsk } from "../../hooks/useChat";
import { useAppSelector, useAppDispatch } from "../../store/store";
import {
  addUserMessage,
  addAssistantMessage,
  addTriageMessage,
  addErrorMessage,
  setTyping,
  setTypingMsgId,
} from "../../store/slices/chatSlice";
import "./chatBox.styles.scss";

const ChatBox = () => {
  const [message, setMessage] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Typewriter state
  const [typingText, setTypingText] = useState("");
  const typeIntervalRef = useRef(null);

  const messagesRef = useRef(null);
  const endRef = useRef(null);
  const lastMsgRef = useRef(null);

  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { dayIndex } = useAppSelector((s) => s.pregnancy);
  const { mode } = useAppSelector((s) => s.theme);
  const { chatHistory, isTyping, typingMsgId } = useAppSelector((s) => s.chat);
  const askMutation = useAsk();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    lastMsgRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [chatHistory, isTyping, typingText]);

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
        dispatch(setTypingMsgId(null));
      }
    }, step);
  }, [typingMsgId, chatHistory]);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;

    const text = message.trim();
    setMessage("");
    dispatch(setTyping(true));

    dispatch(addUserMessage(text));

    try {
      const dayData = dayIndex
        ? { dayIndex, babyUpdate: "", momUpdate: "", tips: "" }
        : null;

      const res = await askMutation.mutateAsync({
        text,
        dayData,
        stream: false,
      });

      if (res.triage) {
        dispatch(addTriageMessage(res.message));
      } else {
        dispatch(addAssistantMessage(res.content));
        setTypingText("");
      }
    } catch {
      dispatch(
        addErrorMessage("Sorry, I encountered an error. Please try again.")
      );
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = null;
      }
      dispatch(setTypingMsgId(null));
      setTypingText("");
    } finally {
      dispatch(setTyping(false));
    }
  };

  const t = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fill = (v) => setMessage(v);

  return (
    <div className={`container ${mode}`}>
      <div className="chat_title">
        <span className="brand">Aya</span>
        <span className="model">Pregnancy 2.5</span>
      </div>

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
              <time className="time">{t(new Date(m.timestamp))}</time>
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
