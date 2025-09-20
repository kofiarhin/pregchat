import React, { useState, useRef, useEffect } from "react";
import { useAsk } from "../../hooks/useChat";
import { useAppSelector } from "../../store/store";
import "./chatBox.styles.scss";

const ChatBox = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAppSelector((state) => state.auth);
  const { dayIndex } = useAppSelector((state) => state.pregnancy);
  const askMutation = useAsk();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;

    const userMessage = message.trim();
    setMessage("");
    setIsTyping(true);

    // Add user message to chat
    setChatHistory((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ]);

    try {
      const dayData = dayIndex
        ? {
            dayIndex,
            babyUpdate: "", // Would be populated from daily content
            momUpdate: "",
            tips: "",
          }
        : null;

      const response = await askMutation.mutateAsync({
        text: userMessage,
        dayData,
        stream: false,
      });

      // Check if it's a triage response
      if (response.triage) {
        setChatHistory((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "triage",
            content: response.message,
            timestamp: new Date(),
          },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "assistant",
            content: response.content,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "error",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-box">
      <div className="chat-box__header">
        <h2>Chat with Aya</h2>
        <p>Your pregnancy wellness assistant</p>
      </div>

      <div className="chat-box__messages">
        {chatHistory.length === 0 && (
          <div className="chat-box__welcome">
            <p>👋 Hi {user?.name || "there"}! I'm Aya, your pregnancy guide.</p>
            <p>Ask me anything about your pregnancy wellness journey!</p>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message chat-message--${msg.type}`}
          >
            <div className="chat-message__content">
              {msg.type === "triage" && (
                <div className="chat-message__warning">
                  ⚠️ <strong>Important:</strong>
                </div>
              )}
              <p>{msg.content}</p>
            </div>
            <div className="chat-message__timestamp">
              {formatTime(msg.timestamp)}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message__content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-box__form" onSubmit={handleSubmit}>
        <div className="chat-box__input-group">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Aya about your pregnancy..."
            className="chat-box__input"
            disabled={isTyping}
          />
          <button
            type="submit"
            className="chat-box__send-btn"
            disabled={!message.trim() || isTyping}
          >
            {isTyping ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
