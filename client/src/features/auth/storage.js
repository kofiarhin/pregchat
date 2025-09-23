const USER_STORAGE_KEY = "pregchat:user";

const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

export const loadStoredUser = () => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to read user from storage", error);
    return null;
  }
};

export const saveStoredUser = (user) => {
  if (!isBrowser()) {
    return;
  }
  try {
    if (user) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Failed to persist user", error);
  }
};
