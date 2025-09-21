import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import authReducer from "./slices/authSlice";
import pregnancyReducer from "./slices/pregnancySlice";
import uiReducer from "./slices/uiSlice";
import chatReducer from "./slices/chatSlice";
import themeReducer from "./slices/themeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pregnancy: pregnancyReducer,
    ui: uiReducer,
    chat: chatReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);
