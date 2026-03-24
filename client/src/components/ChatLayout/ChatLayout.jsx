import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiMenu, FiX } from "react-icons/fi";
import ChatSessionProvider, { useChatSession } from "../../features/chats/context/ChatSessionContext";
import { useChatsQuery } from "../../features/chats/hooks/useChatsQuery";
import { chatsKeys } from "../../features/chats/queryKeys";
import {
  loadActiveThreadId,
  saveActiveThreadId,
} from "../../features/chats/storage";
import { loadStoredUser } from "../../features/auth/storage";
import ThreadSidebar from "../ThreadSidebar/ThreadSidebar";
import ChatBox from "../ChatBox/ChatBox";
import "./chatLayout.styles.scss";

// ── Inner component — has access to ChatSessionContext ────────────────────────

const ChatLayoutContent = ({ dayData }) => {
  const user = loadStoredUser();
  const userId = user?._id || null;

  const queryClient = useQueryClient();
  const context = useChatSession();

  const { data: threads, isSuccess: threadsLoaded } = useChatsQuery();

  const [activeThreadId, setActiveThreadIdState] = useState(
    () => loadActiveThreadId(userId)
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Validate the stored activeThreadId once threads have loaded.
  // Also re-runs when threads changes so deleted threads are handled automatically.
  const hasInitialised = useRef(false);
  useEffect(() => {
    if (!threadsLoaded) return;

    const list = Array.isArray(threads) ? threads : [];

    // On first load, do full validation
    if (!hasInitialised.current) {
      hasInitialised.current = true;
      if (!activeThreadId) return;
      const found = list.find((t) => t.id === activeThreadId);
      if (!found) {
        const fallback = list.length > 0 ? list[0].id : null;
        setActiveThreadIdState(fallback);
        saveActiveThreadId(userId, fallback);
      }
      return;
    }

    // On subsequent updates (e.g. a thread was deleted), check if active thread
    // still exists. If not, fall back.
    if (!activeThreadId) return;
    const stillExists = list.find((t) => t.id === activeThreadId);
    if (!stillExists) {
      const fallback = list.length > 0 ? list[0].id : null;
      setActiveThreadIdState(fallback);
      saveActiveThreadId(userId, fallback);
    }
  }, [threadsLoaded, threads]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unified setter — clears messages, updates state and storage
  const setActiveThread = useCallback(
    (id) => {
      context.messagesSetter?.([]);
      setActiveThreadIdState(id);
      saveActiveThreadId(userId, id);
    },
    [context, userId]
  );

  // Called when ThreadSidebar's "New Chat" creates a thread via useCreateChatMutation.
  // The mutation already updates the chats cache, so no invalidation needed here.
  const handleNewThreadFromSidebar = useCallback(
    (id) => {
      setActiveThread(id);
      setSidebarOpen(false);
    },
    [setActiveThread]
  );

  // Called when ChatBox's useChatMutation auto-creates a thread (fallback path).
  // Need to invalidate the chats list since useCreateChatMutation wasn't used.
  const handleNewThreadFromFallback = useCallback(
    (id) => {
      setActiveThread(id);
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
    },
    [setActiveThread, queryClient]
  );

  const handleSelectThread = useCallback(
    (id) => {
      setActiveThread(id);
      setSidebarOpen(false);
    },
    [setActiveThread]
  );

  return (
    <div className={`chatLayout${sidebarOpen ? " chatLayout--sidebarOpen" : ""}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="chatLayout__overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile toggle button */}
      <button
        type="button"
        className="chatLayout__menuBtn"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      <div className="chatLayout__sidebar">
        <ThreadSidebar
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          onNewThread={handleNewThreadFromSidebar}
        />
      </div>

      <div className="chatLayout__panel">
        <ChatBox
          dayData={dayData}
          conversationId={activeThreadId}
          onNewThread={handleNewThreadFromFallback}
        />
      </div>
    </div>
  );
};

// ── Public component — provides ChatSessionContext ────────────────────────────

const ChatLayout = ({ dayData }) => (
  <ChatSessionProvider>
    <ChatLayoutContent dayData={dayData} />
  </ChatSessionProvider>
);

export default ChatLayout;
