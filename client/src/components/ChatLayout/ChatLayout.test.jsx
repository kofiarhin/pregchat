import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
import React from "react";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockThreads = [];
let mockThreadsLoaded = false;

vi.mock("../../features/chats/hooks/useChatsQuery", () => ({
  useChatsQuery: () => ({
    data: mockThreads,
    isSuccess: mockThreadsLoaded,
  }),
}));

const mockSaveActiveThreadId = vi.fn();
const mockLoadActiveThreadId = vi.fn(() => null);

vi.mock("../../features/chats/storage", () => ({
  loadActiveThreadId: (userId) => mockLoadActiveThreadId(userId),
  saveActiveThreadId: (userId, id) => mockSaveActiveThreadId(userId, id),
  loadChatsFromStorage: () => [],
  saveChatsToStorage: vi.fn(),
  generateChatId: () => "local-id",
}));

vi.mock("../../features/auth/storage", () => ({
  loadStoredUser: () => ({ _id: "user-123" }),
}));

// ThreadSidebar: capture onNewThread and onSelectThread
let capturedOnNewThread = null;
let capturedOnSelectThread = null;

vi.mock("../ThreadSidebar/ThreadSidebar", () => ({
  default: ({ activeThreadId, onSelectThread, onNewThread }) => {
    capturedOnNewThread = onNewThread;
    capturedOnSelectThread = onSelectThread;
    return (
      <div data-testid="sidebar" data-active={activeThreadId}>
        <button onClick={() => onNewThread("new-id")}>New Chat</button>
        <button onClick={() => onSelectThread("thread-2")}>Select Thread 2</button>
      </div>
    );
  },
}));

// ChatBox: expose conversationId and record calls to onNewThread
let capturedConversationId = null;
let capturedChatBoxOnNewThread = null;

vi.mock("../ChatBox/ChatBox", () => ({
  default: ({ conversationId, onNewThread }) => {
    capturedConversationId = conversationId;
    capturedChatBoxOnNewThread = onNewThread;
    return <div data-testid="chatbox" data-conv={conversationId} />;
  },
}));

vi.mock("./chatLayout.styles.scss", () => ({}));
vi.mock("../ThreadSidebar/threadSidebar.styles.scss", () => ({}));

import ChatLayout from "./ChatLayout";

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeThread = (id, title = "Thread") => ({
  id,
  title,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
});

const renderLayout = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChatLayout dayData={null} />
    </QueryClientProvider>
  );
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockThreads = [];
  mockThreadsLoaded = false;
  capturedOnNewThread = null;
  capturedOnSelectThread = null;
  capturedConversationId = null;
  capturedChatBoxOnNewThread = null;
  mockLoadActiveThreadId.mockReturnValue(null);
});

afterEach(() => cleanup());

describe("ChatLayout — initial activeThreadId", () => {
  it("initialises activeThreadId from loadActiveThreadId", () => {
    mockLoadActiveThreadId.mockReturnValue("stored-thread");
    renderLayout();
    expect(mockLoadActiveThreadId).toHaveBeenCalledWith("user-123");
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-active", "stored-thread");
  });

  it("passes null to ChatBox when no stored id and no threads", () => {
    mockLoadActiveThreadId.mockReturnValue(null);
    renderLayout();
    // React does not render the attribute at all when the value is null
    expect(screen.getByTestId("chatbox").getAttribute("data-conv")).toBeNull();
  });
});

describe("ChatLayout — validation on first load", () => {
  it("keeps stored id when it is found in the thread list", async () => {
    mockLoadActiveThreadId.mockReturnValue("thread-1");
    mockThreads = [makeThread("thread-1"), makeThread("thread-2")];
    mockThreadsLoaded = true;

    renderLayout();

    expect(mockSaveActiveThreadId).not.toHaveBeenCalled();
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-active", "thread-1");
  });

  it("falls back to threads[0] when stored id is not in the list", async () => {
    mockLoadActiveThreadId.mockReturnValue("stale-id");
    mockThreads = [makeThread("thread-1"), makeThread("thread-2")];
    mockThreadsLoaded = true;

    renderLayout();

    expect(mockSaveActiveThreadId).toHaveBeenCalledWith("user-123", "thread-1");
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-active", "thread-1");
  });

  it("falls back to null when stored id is not in an empty list", () => {
    mockLoadActiveThreadId.mockReturnValue("stale-id");
    mockThreads = [];
    mockThreadsLoaded = true;

    renderLayout();

    expect(mockSaveActiveThreadId).toHaveBeenCalledWith("user-123", null);
  });
});

describe("ChatLayout — thread switching", () => {
  it("updates activeThreadId and persists when a thread is selected", () => {
    mockThreads = [makeThread("thread-1"), makeThread("thread-2")];
    mockThreadsLoaded = true;
    renderLayout();

    fireEvent.click(screen.getByText("Select Thread 2"));

    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-active", "thread-2");
    expect(mockSaveActiveThreadId).toHaveBeenCalledWith("user-123", "thread-2");
  });

  it("updates activeThreadId and persists when New Chat fires", () => {
    renderLayout();
    fireEvent.click(screen.getByText("New Chat"));

    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-active", "new-id");
    expect(mockSaveActiveThreadId).toHaveBeenCalledWith("user-123", "new-id");
  });
});

describe("ChatLayout — deleted active thread recovery", () => {
  it("falls back to threads[0] when activeThread is removed from the list", () => {
    mockLoadActiveThreadId.mockReturnValue("thread-1");
    mockThreads = [makeThread("thread-1"), makeThread("thread-2")];
    mockThreadsLoaded = true;

    const { rerender } = renderLayout();

    // Simulate thread-1 being deleted — update mock and rerender
    mockThreads = [makeThread("thread-2")];

    rerender(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ChatLayout dayData={null} />
      </QueryClientProvider>
    );

    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-active", "thread-2");
  });
});
