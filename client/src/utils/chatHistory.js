import { BASE_URL } from "../constants/baseUrl.js";

const STORAGE_KEY = "pregchat:chats";

export const loadChatHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to load local chat storage", error);
    return [];
  }
};

export const saveChatHistory = (messages) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages ?? []));
  } catch (error) {
    console.warn("Failed to save local chat storage", error);
  }
};

export const clearChatHistory = async (setMessages, userId = null) => {
  setMessages?.([]);

  try {
    localStorage.removeItem(STORAGE_KEY);
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
