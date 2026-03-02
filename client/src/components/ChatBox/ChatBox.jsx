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
              text: res?.content,
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
    <div className="chat-container">
      <header className="chat-header">
        <div className="logo">Aya · PregChat</div>
        <div className="status-badge">alpha</div>
      </header>
      <main className="chat-viewport">
        {messages.map((m, i) => (
          <div key={i} className={`message-row ${m.role}`}>
            <div className="bubble">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.text}
              </ReactMarkdown>
              <div className="meta">
                <span>{m.time}</span>
                <button
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
        ))}
      </main>
      <form className="chat-composer" onSubmit={handleSubmit}>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask Aya..."
          rows={1}
        />
        <button type="submit" disabled={isPending || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};
export default ChatBox;
