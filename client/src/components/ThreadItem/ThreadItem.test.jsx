import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock("../../features/chats/hooks/useUpdateChatMutation", () => ({
  useUpdateChatMutation: () => ({ mutate: mockUpdateMutate }),
}));

vi.mock("../../features/chats/hooks/useDeleteChatMutation", () => ({
  useDeleteChatMutation: () => ({ mutate: mockDeleteMutate }),
}));

// threadItem.styles.scss — no-op in jsdom
vi.mock("./threadItem.styles.scss", () => ({}));

import ThreadItem from "./ThreadItem";

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeChat = (overrides = {}) => ({
  id: "chat-1",
  title: "Week 12 questions",
  updatedAt: new Date(Date.now() - 60000 * 30).toISOString(), // 30m ago
  createdAt: new Date("2026-01-15").toISOString(),
  ...overrides,
});

const renderItem = (props = {}) => {
  const defaults = {
    chat: makeChat(),
    isActive: false,
    onSelect: vi.fn(),
  };
  return render(<ThreadItem {...defaults} {...props} />);
};

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("ThreadItem — display", () => {
  it("renders the thread title", () => {
    renderItem();
    expect(screen.getByText("Week 12 questions")).toBeInTheDocument();
  });

  it("renders a date fallback when title is empty", () => {
    renderItem({ chat: makeChat({ title: "" }) });
    // Should show "Chat – <some date>" not an empty string
    expect(screen.getByText(/^Chat\s*–/)).toBeInTheDocument();
  });

  it("applies active class when isActive is true", () => {
    const { container } = renderItem({ isActive: true });
    expect(container.firstChild).toHaveClass("threadItem--active");
  });

  it("does not apply active class when isActive is false", () => {
    const { container } = renderItem({ isActive: false });
    expect(container.firstChild).not.toHaveClass("threadItem--active");
  });
});

describe("ThreadItem — selection", () => {
  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    renderItem({ onSelect });
    fireEvent.click(screen.getByRole("button", { name: /week 12/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("calls onSelect on Enter key", () => {
    const onSelect = vi.fn();
    renderItem({ onSelect });
    fireEvent.keyDown(screen.getByRole("button", { name: /week 12/i }), {
      key: "Enter",
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe("ThreadItem — rename", () => {
  it("shows a rename input when the rename button is clicked", () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /rename/i }));
    expect(screen.getByRole("textbox", { name: /rename thread/i })).toBeInTheDocument();
  });

  it("calls useUpdateChatMutation when Enter is pressed with a changed value", () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /rename/i }));
    const input = screen.getByRole("textbox", { name: /rename thread/i });
    fireEvent.change(input, { target: { value: "New title" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockUpdateMutate).toHaveBeenCalledWith({
      chatId: "chat-1",
      data: { title: "New title" },
    });
  });

  it("does not call update when value is unchanged", () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /rename/i }));
    const input = screen.getByRole("textbox", { name: /rename thread/i });
    // Leave value as-is (same as chat.title)
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockUpdateMutate).not.toHaveBeenCalled();
  });

  it("cancels rename on Escape without saving", () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /rename/i }));
    const input = screen.getByRole("textbox", { name: /rename thread/i });
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(mockUpdateMutate).not.toHaveBeenCalled();
    // Input should be gone
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});

describe("ThreadItem — delete", () => {
  it("shows delete confirm when the delete button is clicked", () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByText(/delete this chat/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /yes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /no/i })).toBeInTheDocument();
  });

  it("calls useDeleteChatMutation when Yes is clicked", () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /yes/i }));
    expect(mockDeleteMutate).toHaveBeenCalledWith("chat-1");
  });

  it("dismisses delete confirm when No is clicked without deleting", () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /no/i }));
    expect(mockDeleteMutate).not.toHaveBeenCalled();
    // Confirm UI gone
    expect(screen.queryByText(/delete this chat/i)).not.toBeInTheDocument();
  });
});
