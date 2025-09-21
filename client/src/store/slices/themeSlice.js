// src/store/slices/themeSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialMode = (() => {
  try {
    const saved = localStorage.getItem("aya_theme");
    return saved === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
})();

const themeSlice = createSlice({
  name: "theme",
  initialState: { mode: initialMode },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("aya_theme", state.mode);
      } catch {}
    },
    setTheme: (state, action) => {
      state.mode = action.payload === "light" ? "light" : "dark";
      try {
        localStorage.setItem("aya_theme", state.mode);
      } catch {}
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
