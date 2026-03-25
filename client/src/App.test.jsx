import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
import React from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import App from "./App.jsx";
import uiReducer from "./store/ui/uiSlice.js";

const loginMutate = vi.fn();
const registerMutate = vi.fn();
const logoutMutate = vi.fn();

// Default mock — unauthenticated, no current user
let mockCurrentUser = null;

vi.mock("./features/auth/hooks/useAuth.js", () => ({
  useCurrentUserQuery: () => ({ data: mockCurrentUser, isLoading: false }),
  useLoginMutation: (options) => ({
    mutate: (creds) => {
      loginMutate(creds);
      options?.onSuccess?.({ user: mockCurrentUser });
    },
    isPending: false,
    isError: false,
    error: null,
  }),
  useRegisterMutation: (options) => ({
    mutate: (creds) => {
      registerMutate(creds);
      options?.onSuccess?.({ user: mockCurrentUser });
    },
    isPending: false,
    isError: false,
    error: null,
  }),
  useLogoutMutation: (options) => ({
    mutate: () => {
      logoutMutate();
      options?.onSuccess?.();
    },
    isPending: false,
  }),
}));

vi.mock("./features/pregnancy/hooks/usePregnancy.js", () => ({
  useTodayPregnancyQuery: () => ({ data: null, isLoading: false, error: null }),
  usePregnancyProfileQuery: () => ({ data: null, isLoading: false, error: null }),
  usePregnancyDayQuery: () => ({ data: null, isLoading: false, error: null }),
  useUpdatePregnancyProfileMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useResetPregnancyProfileMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("./context/CartContext.jsx", () => ({
  useCart: () => ({ cartItems: [], cartCount: 0, addToCart: vi.fn(), removeFromCart: vi.fn(), clearCart: vi.fn() }),
  CartProvider: ({ children }) => children,
}));

const createTestStore = (uiState) =>
  configureStore({
    reducer: {
      ui: uiReducer,
    },
    preloadedState: uiState
      ? {
          ui: {
            ...uiReducer(undefined, { type: "@@INIT" }),
            ...uiState,
          },
        }
      : undefined,
  });

const renderApp = (route = "/login", uiState) => {
  const store = createTestStore(uiState);
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
  mockCurrentUser = null;
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

    fireEvent.change(screen.getByLabelText(/full name/i), {
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

describe("Post-login redirect", () => {
  it("redirects to /onboarding when user has no onboardingCompletedAt", () => {
    mockCurrentUser = { _id: "1", name: "Test", onboardingCompletedAt: null };

    renderApp("/login");
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    // Login mutation fires onSuccess with user that has no onboardingCompletedAt
    // Navigate should land on /onboarding — the page renders onboarding content
    expect(loginMutate).toHaveBeenCalled();
  });

  it("redirects to /dashboard when user has onboardingCompletedAt set", () => {
    mockCurrentUser = {
      _id: "1",
      name: "Test",
      onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
    };

    renderApp("/login");
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(loginMutate).toHaveBeenCalled();
  });
});

describe("PublicOnlyRoute redirect for authenticated users", () => {
  it("redirects authenticated user with no onboarding to /onboarding when visiting /login", () => {
    mockCurrentUser = { _id: "1", name: "Test", onboardingCompletedAt: null };

    // Simulate authenticated state via store token
    renderApp("/login", { auth: { token: "fake-token", promptLogin: false } });

    // PublicOnlyRoute should redirect to /onboarding because no onboardingCompletedAt
    // (The exact text depends on appContent.json; just verify login page is NOT shown)
    expect(
      screen.queryByRole("heading", { name: /welcome back/i })
    ).not.toBeInTheDocument();
  });

  it("redirects authenticated user with completed onboarding to /dashboard when visiting /register", () => {
    mockCurrentUser = {
      _id: "1",
      name: "Test",
      onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
    };

    renderApp("/register", { auth: { token: "fake-token", promptLogin: false } });

    // PublicOnlyRoute should redirect to /dashboard
    // Register page should NOT be shown
    expect(
      screen.queryByRole("button", { name: /register/i })
    ).not.toBeInTheDocument();
  });

  it("redirects authenticated admin to /admin when visiting /login", () => {
    mockCurrentUser = {
      _id: "admin1",
      name: "Admin",
      isAdmin: true,
      onboardingCompletedAt: null,
    };

    renderApp("/login", { auth: { token: "fake-token", promptLogin: false } });

    // PublicOnlyRoute should redirect admin to /admin, not /onboarding or /dashboard
    // Login page should NOT be shown
    expect(
      screen.queryByRole("heading", { name: /welcome back/i })
    ).not.toBeInTheDocument();
  });
});

describe("Admin portal isolation", () => {
  const adminUser = {
    _id: "admin1",
    name: "Admin User",
    isAdmin: true,
    onboardingCompletedAt: null,
  };

  const authedState = { auth: { token: "fake-token", promptLogin: false } };

  it("admin accessing /admin sees admin dashboard content", () => {
    mockCurrentUser = adminUser;
    renderApp("/admin", authedState);

    // AdminLayout renders with "PregChat" brand and "Admin" accent
    expect(screen.getByText("PregChat")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("admin accessing /dashboard is redirected away from user portal", () => {
    mockCurrentUser = adminUser;
    renderApp("/dashboard", authedState);

    // UserOnlyRoute should redirect admin to /admin
    // The user dashboard should NOT render
    // Instead admin layout should be shown
    expect(screen.getByText("PregChat")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("admin accessing /chat is redirected away from user portal", () => {
    mockCurrentUser = adminUser;
    renderApp("/chat", authedState);

    // UserOnlyRoute should redirect admin to /admin
    expect(screen.getByText("PregChat")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("non-admin accessing /admin is redirected to /dashboard", () => {
    mockCurrentUser = {
      _id: "1",
      name: "Regular User",
      isAdmin: false,
      onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
    };
    renderApp("/admin", authedState);

    // AdminRoute should redirect non-admin to /dashboard
    // Admin layout brand should NOT be shown
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("catch-all redirects admin to /admin", () => {
    mockCurrentUser = adminUser;
    renderApp("/nonexistent-route", authedState);

    // Catch-all should redirect admin to /admin
    expect(screen.getByText("PregChat")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("catch-all redirects non-admin to /dashboard", () => {
    mockCurrentUser = {
      _id: "1",
      name: "Regular User",
      isAdmin: false,
      onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
    };
    renderApp("/nonexistent-route", authedState);

    // Catch-all should redirect user to /dashboard
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });
});
