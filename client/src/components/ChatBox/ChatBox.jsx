import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiCopy, FiCheck } from "react-icons/fi";
import useChatMutation from "../../hooks/useChatMutation";
import "./chatBox.styles.scss";

const ChatBox = () => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const { mutate, isPending } = useChatMutation();

  const taRef = useRef(null);
  const endRef = useRef(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 160); // cap height
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
    if (!text.trim()) return;

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

  return (
    <div className="chat">
      <header className="chat__header">
        <div className="chat__brand">
          <div className="chat__title">Aya · PregChat</div>
          <div className="chat__subtitle">Private, fast answers</div>
        </div>

        <div className="chat__right">
          <span className="chat__badge">alpha</span>
          <span className="chat__dot" aria-hidden="true" />
        </div>
      </header>

      <main className="chat__viewport" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat__empty">
            <div className="chat__emptyCard">
              <div className="chat__emptyTitle">
                Ask anything about pregnancy
              </div>
              <div className="chat__emptyText">
                Try: “I’m 24 days in. What changes should I expect today?”
              </div>
              <div className="chat__chips">
                <button
                  type="button"
                  className="chat__chip"
                  onClick={() =>
                    setText(
                      "I’m 24 days in. What changes should I expect today?",
                    )
                  }
                >
                  Daily update
                </button>
                <button
                  type="button"
                  className="chat__chip"
                  onClick={() =>
                    setText("What foods should I avoid in early pregnancy?")
                  }
                >
                  Foods to avoid
                </button>
                <button
                  type="button"
                  className="chat__chip"
                  onClick={() => setText("Is cramping normal in week 4?")}
                >
                  Is this normal?
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="chat__messages">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            const rowClass = isUser
              ? "chat__row chat__row--user"
              : "chat__row chat__row--assistant";
            const name = isUser ? "You" : "Aya";
            const initial = isUser ? "Y" : "A";

            return (
              <div key={i} className={rowClass}>
                <div className="chat__avatar" aria-hidden="true">
                  {initial}
                </div>

                <div className="chat__bubble">
                  <div className="chat__bubbleHeader">
                    <span className="chat__name">{name}</span>
                    <span className="chat__time">{m.time}</span>
                  </div>

                  <div className="chat__content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.text}
                    </ReactMarkdown>
                  </div>

                  <div className="chat__actions">
                    <button
                      type="button"
                      className="chat__iconBtn"
                      aria-label="Copy message"
                      onClick={() => {
                        navigator.clipboard.writeText(m.text);
                        setCopiedIndex(i);
                        setTimeout(() => setCopiedIndex(null), 1200);
                      }}
                    >
                      {copiedIndex === i ? <FiCheck /> : <FiCopy />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {isPending ? (
            <div className="chat__row chat__row--assistant">
              <div className="chat__avatar" aria-hidden="true">
                A
              </div>
              <div className="chat__bubble chat__bubble--typing">
                <div className="chat__bubbleHeader">
                  <span className="chat__name">Aya</span>
                  <span className="chat__time">…</span>
                </div>
                <div className="chat__typing" aria-label="Assistant typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>
      </main>

      <form className="chat__composer" onSubmit={handleSubmit}>
        <div className="chat__composerInner">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask Aya..."
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
          >
            Send
          </button>
        </div>

        <div className="chat__hint">
          Press <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd>{" "}
          for new line
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
