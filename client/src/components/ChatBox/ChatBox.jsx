import { useEffect, useRef, useState } from "react";
import { BASE_URL } from "../../constants/baseUrl";
import useChatMutation from "../../hooks/useChatMutation";
import "./chatBox.styles.scss";

const ChatBox = () => {
  const [text, setText] = useState("give me a 5 day meal plan");
  const [messages, setMessages] = useState([]);
  const { mutate, isPending } = useChatMutation();

  const endRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { await fetch(`${BASE_URL}/health`); } catch {}
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

    setMessages((prev) => [...prev, { role: "user", text: value }]);
    setText("");
    autosize(taRef.current);

    mutate(
      { text: value },
      {
        onSuccess: (res) => {
          setMessages((prev) => [...prev, { role: "system", text: res.content }]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            { role: "system", text: "Sorry, something went wrong. Try again." },
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

  return (
    <div id="chatgpt-shell">
      <main className="chat-scroll">
        <div className="chat-content">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`row ${m.role === "system" ? "assistant" : "user"}`}
            >
              <div className="avatar">{m.role === "system" ? "🤖" : "🧑"}</div>
              <div className="bubble">{m.text}</div>
            </div>
          ))}

          {isPending && (
            <div className="row assistant">
              <div className="avatar">🤖</div>
              <div className="bubble typing">
                <span></span><span></span><span></span>
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
            placeholder="Send a message..."
            rows={1}
          />
          <button type="submit" disabled={isPending || !text.trim()}>
            ➤
          </button>
        </div>
        <p className="hint">Press Enter to send • Shift+Enter for newline</p>
      </form>
    </div>
  );
};

export default ChatBox;