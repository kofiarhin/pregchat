import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import content from "../content/appContent.json";
import { FiSend } from "react-icons/fi";
import VoiceControls from "./VoiceControls.jsx";
import "./chatInput.styles.scss";

const ChatInput = ({
  onSend,
  placeholder = "Ask Aya about your pregnancy...",
  isSending = false,
  autoFocus = true,
}) => {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const voiceLaunchLabel = content.voice?.page?.controls?.launch ?? "Voice Mode";
  const inputRef = useRef(null);

  const handleSend = useCallback(
    async (text) => {
      const message = typeof text === "string" ? text.trim() : "";

      if (!message || typeof onSend !== "function" || isSending) {
        return;
      }

      await onSend(message);
    },
    [isSending, onSend],
  );

  const resetInput = useCallback(() => {
    setValue("");
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = value.trim();

    if (!message || isSending) {
      return;
    }

    await handleSend(message);
    resetInput();
  };

  const handleVoiceSend = useCallback(
    async (text) => {
      const clean = (text || "").trim();

      if (!clean) {
        return;
      }

      await handleSend(clean);
      resetInput();
    },
    [handleSend, resetInput],
  );

  return (
    <div className="chatInput">
      <form className="chatInput__form" onSubmit={handleSubmit}>
        <div className="chatInput__field">
          <input
            ref={inputRef}
            className="chatInput__input"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            disabled={isSending}
            autoFocus={autoFocus}
            aria-label="Type your message"
          />
          <button
            className="chatInput__send"
            type="submit"
            aria-label="Send message"
            title="Send message"
            disabled={!value.trim() || isSending}
          >
            <FiSend aria-hidden="true" />
          </button>
        </div>
      </form>

      <div className="chatInput__extras">
        <VoiceControls onSend={handleVoiceSend} />

        <button
          type="button"
          className="chatInput__voiceMode"
          onClick={() => navigate("/voice")}
        >
          {voiceLaunchLabel}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
