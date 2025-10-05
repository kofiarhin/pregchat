import { useEffect, useState } from "react";
import { BASE_URL } from "../../constants/baseUrl";
import useChatMutation from "../../hooks/useChatMutation";
import "./chatBox.styles.scss";

const ChatBox = () => {
  const [text, setText] = useState("give me a 5 day meal plan");
  const [messages, setMessages] = useState([]);
  const { data, mutate, isLoading, isError, error, isPending } =
    useChatMutation();

  useEffect(() => {
    (async () => {
      const res = await fetch(`${BASE_URL}/health`);
      const json = await res.json();
    })();
  }, []);

  const handleChange = (e) => setText(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setText("");
    mutate(
      { text },
      {
        onSuccess: (res) => {
          setMessages((prev) => [
            ...prev,
            { role: "system", text: res.content },
          ]);
        },
        onError: (err) => {
          console.error("chat failed", err);
        },
      }
    );
  };

  return (
    <div id="chat-box">
      <div className="messages-wrapper">
        {messages &&
          messages.map((message, index) => (
            <div
              key={index}
              className={`message-unit ${
                message.role === "system" ? "system" : "user"
              }`}
            >
              <div className="message-bubble">{message.text}</div>
            </div>
          ))}
        {isPending && (
          <div className="message-unit system">
            <div className="message-bubble typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            type="text"
            name="text"
            placeholder="Ask your question..."
            value={text}
            onChange={handleChange}
          />
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
