// ChatBox.jsx
import { useEffect, useRef, useState } from "react";
import { BASE_URL } from "../../constants/baseUrl";
import useChatMutation from "../../hooks/useChatMutation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiCopy, FiCheck } from "react-icons/fi"; // ✅ React Icons
import "./chatBox.styles.scss";

const ChatBox = () => {
  const [text, setText] = useState("give me a 5 day meal plan");
  const [messages, setMessages] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const { mutate, isPending } = useChatMutation();

  const endRef = useRef(null);
  const taRef = useRef(null);

  const nowTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    (async () => {
      try {
        await fetch(`${BASE_URL}/health`);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const autosize = (el) => {
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const handleChange = (e) => {
    setText(e.target.value);
    autosize(e.target);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: value, time: nowTime() },
    ]);
    setText("");
    autosize(taRef.current);

    mutate(
      { text: value },
      {
        onSuccess: (res) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              text: res?.content || "",
              time: nowTime(),
            },
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              text: "Sorry, something went wrong. Please try again.",
              time: nowTime(),
            },
          ]);
        },
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1200);
    } catch {}
  };

  return (
    <div id="chatgpt-shell">
      <main className="chat-scroll">
        <div className="chat-content">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`row ${m.role === "system" ? "assistant" : "user"}`}
            >
              <div className="avatar" aria-hidden>
                {m.role === "system" ? "🤖" : "🧑"}
              </div>

              <div className="bubble markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: (props) => (
                      <a target="_blank" rel="noreferrer" {...props} />
                    ),
                    code: ({ inline, ...props }) =>
                      inline ? (
                        <code {...props} />
                      ) : (
                        <pre>
                          <code {...props} />
                        </pre>
                      ),
                  }}
                >
                  {m.text}
                </ReactMarkdown>

                <div className="meta">
                  <span className="timestamp">{m.time}</span>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy(m.text, i)}
                    title="Copy message"
                  >
                    {copiedIndex === i ? (
                      <FiCheck className="icon success" />
                    ) : (
                      <FiCopy className="icon" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {isPending && (
            <div className="row assistant">
              <div className="avatar" aria-hidden>
                🤖
              </div>
              <div className="bubble typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </main>

      <form className="composer" onSubmit={handleSubmit}>
        <div className="composer-inner">
          <textarea
            ref={taRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Send a message…"
            rows={1}
            aria-label="Message input"
          />
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            aria-label="Send"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
