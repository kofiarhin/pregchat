import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import uiReducer from "./ui/uiSlice.js";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
  },
  devTools: import.meta.env.DEV,
});

export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);
