import React, { useEffect, useRef } from "react";
import useVoice from "../hooks/useVoice.js";
import "./chatWindow.styles.scss";

const formatTime = (value) => {
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "";
  }
};

const ChatWindow = ({ messages = [], isSending = false }) => {
  const scrollAnchorRef = useRef(null);
  const lastSpokenRef = useRef(null);
  const { supported, speak, cancelSpeech } = useVoice();

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

  useEffect(() => {
    if (!supported.tts) {
      return undefined;
    }

    const latestAssistant = [...messages]
      .reverse()
      .find((message) => message?.role === "assistant" && message?.content);

    if (!latestAssistant) {
      return undefined;
    }

    const key = latestAssistant.id || latestAssistant.timestamp || latestAssistant.content;

    if (lastSpokenRef.current === key) {
      return undefined;
    }

    lastSpokenRef.current = key;

    speak(latestAssistant.content, {
      rate: 0.96,
      pitch: 1,
      volume: 1,
    });

    return () => {
      cancelSpeech();
    };
  }, [messages, speak, cancelSpeech, supported.tts]);

  useEffect(() => {
    if (!messages.length) {
      lastSpokenRef.current = null;
    }
  }, [messages.length]);

  useEffect(() => () => {
    cancelSpeech();
  }, [cancelSpeech]);

  const renderMessage = (entry, index) => {
    const tone = entry?.meta?.triage ? "triage" : entry?.role;
    const key = entry?.id || entry?.timestamp || index;

    return (
      <div key={key} className={`bubble bubble--${tone ?? "assistant"}`}>
        <div className="body">
          {entry?.meta?.triage && <div className="flag">Important</div>}
          <p>{entry?.content}</p>
        </div>
        <time className="time">{formatTime(entry?.timestamp)}</time>
      </div>
    );
  };

  return (
    <main className="messages">
      {messages.map(renderMessage)}

      {isSending && (
        <div className="bubble bubble--assistant">
          <div className="body">
            <div className="typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      )}

      <div ref={scrollAnchorRef} />
    </main>
  );
};

export default ChatWindow;
