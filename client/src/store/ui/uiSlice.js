import { createSlice } from "@reduxjs/toolkit";

const loadToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem("token");
  } catch (error) {
    console.error("Failed to read token from storage", error);
    return null;
  }
};

const persistToken = (token) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (token) {
      window.localStorage.setItem("token", token);
    } else {
      window.localStorage.removeItem("token");
    }
  } catch (error) {
    console.error("Failed to persist token", error);
  }
};

const initialState = {
  theme: "dark",
  navigation: {
    isSidebarOpen: false,
  },
  panels: {
    active: null,
  },
  modals: {
    current: null,
    payload: null,
  },
  toasts: [],
  auth: {
    token: loadToken(),
    promptLogin: false,
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state, action) => {
      const explicit = action.payload;
      state.navigation.isSidebarOpen =
        typeof explicit === "boolean"
          ? explicit
          : !state.navigation.isSidebarOpen;
    },
    openPanel: (state, action) => {
      state.panels.active = action.payload;
    },
    closePanel: (state) => {
      state.panels.active = null;
    },
    openModal: (state, action) => {
      state.modals.current = action.payload.type;
      state.modals.payload = action.payload.payload ?? null;
    },
    closeModal: (state) => {
      state.modals.current = null;
      state.modals.payload = null;
    },
    enqueueToast: (state, action) => {
      const toast = {
        id: action.payload.id ?? [Date.now(), Math.random()].join("-"),
        message: action.payload.message,
        tone: action.payload.tone ?? "info",
        duration: action.payload.duration ?? 4000,
      };
      state.toasts.push(toast);
    },
    dequeueToast: (state, action) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    setAuthToken: (state, action) => {
      state.auth.token = action.payload ?? null;
      persistToken(state.auth.token);
    },
    clearAuthToken: (state) => {
      state.auth.token = null;
      persistToken(null);
    },
    triggerLoginPrompt: (state) => {
      state.auth.promptLogin = true;
    },
    clearLoginPrompt: (state) => {
      state.auth.promptLogin = false;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  openPanel,
  closePanel,
  openModal,
  closeModal,
  enqueueToast,
  dequeueToast,
  setAuthToken,
  clearAuthToken,
  triggerLoginPrompt,
  clearLoginPrompt,
} = uiSlice.actions;

export const selectAuthToken = (state) => state.ui.auth.token;
export const selectLoginPrompt = (state) => state.ui.auth.promptLogin;
export const selectActiveModal = (state) => state.ui.modals.current;
export const selectToasts = (state) => state.ui.toasts;

export default uiSlice.reducer;
