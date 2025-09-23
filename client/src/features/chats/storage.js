const STORAGE_KEY = "pregchat:chats";

const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

export const loadChatsFromStorage = () => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read chats from storage", error);
    return [];
  }
};

export const saveChatsToStorage = (updater) => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const current = loadChatsFromStorage();
    const next =
      typeof updater === "function" ? updater(current) : Array.isArray(updater) ? updater : [];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.error("Failed to persist chats", error);
    return [];
  }
};

export const generateChatId = () => `${Date.now()}-${Math.round(Math.random() * 1000)}`;
