import ChatLayout from "../components/ChatLayout/ChatLayout.jsx";
import { useTodayPregnancyQuery } from "../features/pregnancy/hooks/usePregnancy.js";

const Chat = () => {
  const { data: todaySummary } = useTodayPregnancyQuery({ enabled: true });

  return <ChatLayout dayData={todaySummary} />;
};

export default Chat;
