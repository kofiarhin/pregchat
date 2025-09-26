import React from "react";
import ChatBox from "../components/ChatBox/ChatBox.jsx";
import { useTodayPregnancyQuery } from "../features/pregnancy/hooks/usePregnancy.js";
import "../components/ChatBox/chatBox.styles.scss";
import VoiceChat from "./voice/VoiceChat.jsx";

const Chat = () => {
  const { data: todaySummary } = useTodayPregnancyQuery({
    enabled: true,
  });

  return (
    <div className="chat-container">
      <VoiceChat />
    </div>
  );
};

export default Chat;
