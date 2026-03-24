import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockThreads = [];
let mockIsLoading = false;
let mockIsError = false;
const mockCreateMutate = vi.fn();
let mockIsCreating = false;

vi.mock("../../features/chats/hooks/useChatsQuery", () => ({
  useChatsQuery: () => ({
    data: mockThreads,
    isLoading: mockIsLoading,
    isError: mockIsError,
  }),
}));

vi.mock("../../features/chats/hooks/useCreateChatMutation", () => ({
  useCreateChatMutation: (options) => ({
    mutate: (payload) => {
      mockCreateMutate(payload);
      // Simulate immediate success for testing
      options?.onSuccess?.({ id: "new-thread-id", title: "" });
    },
    isPending: mockIsCreating,
  }),
}));

// Mock ThreadItem to keep sidebar tests focused
vi.mock("../ThreadItem/ThreadItem", () => ({
  default: ({ chat, isActive, onSelect }) => (
    <div
      data-testid={`thread-item-${chat.id}`}
      data-active={String(isActive)}
      onClick={onSelect}
      role="button"
      aria-pressed={isActive}
    >
      {chat.title || chat.id}
    </div>
  ),
}));

vi.mock("./threadSidebar.styles.scss", () => ({}));

import ThreadSidebar from "./ThreadSidebar";

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeThread = (id, title = "Thread") => ({
  id,
  title,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
});

const renderSidebar = (props = {}) => {
  const defaults = {
    activeThreadId: null,
    onSelectThread: vi.fn(),
    onNewThread: vi.fn(),
  };
  return render(<ThreadSidebar {...defaults} {...props} />);
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockThreads = [];
  mockIsLoading = false;
  mockIsError = false;
  mockIsCreating = false;
});

afterEach(() => cleanup());

describe("ThreadSidebar — thread list", () => {
  it("renders a thread item for each thread", () => {
    mockThreads = [makeThread("1", "Week 12"), makeThread("2", "Nutrition")];
    renderSidebar();
    expect(screen.getByTestId("thread-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("thread-item-2")).toBeInTheDocument();
  });

  it("shows empty state when thread list is empty", () => {
    mockThreads = [];
    renderSidebar();
    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });

  it("marks the correct thread as active", () => {
    mockThreads = [makeThread("1", "Week 12"), makeThread("2", "Nutrition")];
    renderSidebar({ activeThreadId: "2" });
    expect(screen.getByTestId("thread-item-2")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("thread-item-1")).toHaveAttribute("data-active", "false");
  });

  it("calls onSelectThread with the thread id when a thread is clicked", () => {
    mockThreads = [makeThread("1", "Week 12")];
    const onSelectThread = vi.fn();
    renderSidebar({ onSelectThread });
    fireEvent.click(screen.getByTestId("thread-item-1"));
    expect(onSelectThread).toHaveBeenCalledWith("1");
  });
});

describe("ThreadSidebar — loading state", () => {
  it("shows skeleton rows while loading", () => {
    mockIsLoading = true;
    const { container } = renderSidebar();
    expect(container.querySelectorAll(".threadSidebar__skeleton").length).toBeGreaterThan(0);
  });

  it("does not show thread items while loading", () => {
    mockIsLoading = true;
    mockThreads = [makeThread("1")];
    renderSidebar();
    expect(screen.queryByTestId("thread-item-1")).not.toBeInTheDocument();
  });
});

describe("ThreadSidebar — error state", () => {
  it("shows error message when query fails", () => {
    mockIsError = true;
    renderSidebar();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/could not load/i)).toBeInTheDocument();
  });
});

describe("ThreadSidebar — New Chat button", () => {
  it("calls createChat and passes the new id to onNewThread", () => {
    const onNewThread = vi.fn();
    renderSidebar({ onNewThread });
    fireEvent.click(screen.getByRole("button", { name: /new chat/i }));
    expect(mockCreateMutate).toHaveBeenCalledWith({});
    expect(onNewThread).toHaveBeenCalledWith("new-thread-id");
  });

  it("disables the New Chat button while creating", () => {
    mockIsCreating = true;
    renderSidebar();
    expect(screen.getByRole("button", { name: /new chat/i })).toBeDisabled();
  });
});
