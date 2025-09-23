import { BASE_URL } from "../constants/baseUrl.js";

export const clearChatHistory = async (setMessages, userId = null) => {
  setMessages?.([]);

  try {
    localStorage.removeItem("pregchat:chats");
  } catch (error) {
    console.warn("Failed to clear local chat storage", error);
  }

  if (!userId) {
    return;
  }

  try {
    await fetch(`${BASE_URL}/api/messages/${userId}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.warn("Server chat clear failed:", error?.message || error);
  }
};
