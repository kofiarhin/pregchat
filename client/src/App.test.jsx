import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
import React from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import authReducer from "./store/slices/authSlice";
import pregnancyReducer from "./store/slices/pregnancySlice";
import uiReducer from "./store/slices/uiSlice";
import chatReducer from "./store/slices/chatSlice";
import themeReducer from "./store/slices/themeSlice";

const loginMutate = vi.fn();
const registerMutate = vi.fn();

vi.mock("./hooks/useAuthQuery", () => ({
  useMe: () => ({ data: null, isLoading: false }),
  useLogin: () => ({
    mutate: loginMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useRegister: () => ({
    mutate: registerMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("./hooks/usePregnancyQuery", () => ({
  useGetToday: () => ({ data: null, isLoading: false }),
}));

const createTestStore = (authState) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      pregnancy: pregnancyReducer,
      ui: uiReducer,
      chat: chatReducer,
      theme: themeReducer,
    },
    preloadedState: authState
      ? {
          auth: {
            ...authReducer(undefined, { type: "@@INIT" }),
            ...authState,
          },
        }
      : undefined,
  });
};

const renderApp = (route = "/login", authState) => {
  const store = createTestStore(authState);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  window.history.pushState({}, "", route);

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("App routing", () => {
  it("renders login route and submits credentials", () => {
    renderApp("/login");

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(loginMutate).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("renders register route and submits details", () => {
    renderApp("/register");

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "tester@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepass" },
    });
    fireEvent.change(screen.getByLabelText(/region/i), {
      target: { value: "US" },
    });

    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    expect(registerMutate).toHaveBeenCalledWith({
      name: "Test User",
      email: "tester@example.com",
      password: "securepass",
      region: "US",
    });
  });

  it("redirects unauthenticated users to login when visiting chat", () => {
    renderApp("/chat");

    expect(
      screen.getByRole("heading", { name: /welcome back/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });
});
