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

// ── Active thread persistence ─────────────────────────────────────────────────
// Keyed per user so switching accounts never bleeds state.

const activeThreadKey = (userId) => `pregchat:activeThreadId:${userId}`;

export const saveActiveThreadId = (userId, threadId) => {
  if (!isBrowser() || !userId) return;
  try {
    if (threadId) {
      window.localStorage.setItem(activeThreadKey(userId), threadId);
    } else {
      window.localStorage.removeItem(activeThreadKey(userId));
    }
  } catch (error) {
    console.error("Failed to persist activeThreadId", error);
  }
};

export const loadActiveThreadId = (userId) => {
  if (!isBrowser() || !userId) return null;
  try {
    return window.localStorage.getItem(activeThreadKey(userId)) || null;
  } catch (error) {
    console.error("Failed to read activeThreadId from storage", error);
    return null;
  }
};
