import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiCopy, FiCheck, FiSend } from "react-icons/fi";
import useChatMutation from "../../hooks/useChatMutation";
import "./chatBox.styles.scss";

const SUGGESTIONS = [
  {
    label: "Daily update",
    text: "I'm 24 days in. What changes should I expect today?",
  },
  {
    label: "Foods to avoid",
    text: "What foods should I avoid in early pregnancy?",
  },
  {
    label: "Is this normal?",
    text: "Is cramping normal in week 4?",
  },
  {
    label: "Exercise tips",
    text: "What exercises are safe during the first trimester?",
  },
];

const ChatBox = ({ dayData }) => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const { mutate, isPending } = useChatMutation();

  const taRef = useRef(null);
  const endRef = useRef(null);
  const viewportRef = useRef(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${next}px`;
  };

  useEffect(() => {
    autoGrow();
  }, [text]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isPending) return;

    const userMsg = {
      role: "user",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setText("");

    mutate(
      { text: userMsg.text },
      {
        onSuccess: (res) =>
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              text: res?.content || "",
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]),
      },
    );
  };

  const handleCopy = (msgText, index) => {
    navigator.clipboard.writeText(msgText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleSuggestion = (suggestion) => {
    setText(suggestion);
    taRef.current?.focus();
  };

  return (
    <div className="chat">
      <main className="chat__viewport" ref={viewportRef} aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat__welcome">
            <div className="chat__welcomeIcon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="chat__welcomeTitle">Chat with Aya</h2>
            <p className="chat__welcomeText">
              Your pregnancy wellness assistant. Ask about symptoms, nutrition, milestones, or anything on your mind.
            </p>
            <div className="chat__suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className="chat__suggestion"
                  onClick={() => handleSuggestion(s.text)}
                >
                  <span className="chat__suggestionLabel">{s.label}</span>
                  <span className="chat__suggestionPreview">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="chat__messages">
          {messages.map((m, i) => {
            const isUser = m.role === "user";

            return (
              <div
                key={i}
                className={`chat__row ${isUser ? "chat__row--user" : "chat__row--assistant"}`}
              >
                {!isUser && (
                  <div className="chat__avatar chat__avatar--aya" aria-hidden="true">
                    A
                  </div>
                )}

                <div className="chat__bubble">
                  <div className="chat__content">
                    {isUser ? (
                      <p>{m.text}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.text}
                      </ReactMarkdown>
                    )}
                  </div>

                  <div className="chat__meta">
                    <span className="chat__time">{m.time}</span>
                    {!isUser && (
                      <button
                        type="button"
                        className="chat__copyBtn"
                        aria-label="Copy message"
                        onClick={() => handleCopy(m.text, i)}
                      >
                        {copiedIndex === i ? (
                          <FiCheck size={13} />
                        ) : (
                          <FiCopy size={13} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="chat__avatar chat__avatar--user" aria-hidden="true">
                    Y
                  </div>
                )}
              </div>
            );
          })}

          {isPending && (
            <div className="chat__row chat__row--assistant">
              <div className="chat__avatar chat__avatar--aya" aria-hidden="true">
                A
              </div>
              <div className="chat__bubble chat__bubble--typing">
                <div className="chat__typing" aria-label="Aya is typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </main>

      <form className="chat__composer" onSubmit={handleSubmit}>
        <div className="chat__composerInner">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message Aya..."
            rows={1}
            className="chat__textarea"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            className="chat__send"
            disabled={isPending || !text.trim()}
            aria-label="Send message"
          >
            <FiSend size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
