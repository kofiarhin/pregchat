import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App.jsx";
import { store } from "./store/store.js";
import {
  enqueueToast,
  triggerLoginPrompt,
} from "./store/ui/uiSlice.js";
import "./styles/global.scss";
import CartProvider from "./context/CartContext.jsx";
import BookingProvider from "./context/BookingContext.jsx";
import VoiceProvider from "./state/voice/VoiceProvider.jsx";

const shouldRetryQuery = (failureCount, error) => {
  if (error?.status === 401) {
    return false;
  }
  if (error?.status && error.status < 500) {
    return false;
  }
  return failureCount < 2;
};

const queryCache = new QueryCache({
  onError: (error) => {
    if (error?.status === 401) {
      store.dispatch(triggerLoginPrompt());
      store.dispatch(
        enqueueToast({
          message: "Session expired. Please sign in again.",
          tone: "warning",
        })
      );
    }
  },
});

const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: shouldRetryQuery,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <BookingProvider>
            <VoiceProvider>
              <App />
            </VoiceProvider>
          </BookingProvider>
        </CartProvider>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
