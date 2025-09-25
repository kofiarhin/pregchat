import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatsQuery } from "../../features/chats/hooks/useChatsQuery.js";
import { useCreateChatMutation } from "../../features/chats/hooks/useCreateChatMutation.js";
import { useInfiniteMessagesQuery } from "../../features/messages/hooks/useInfiniteMessagesQuery.js";
import { FiSend } from "react-icons/fi";
import { useSendMessageMutation } from "../../features/messages/hooks/useSendMessageMutation.js";
import { useCurrentUserQuery } from "../../features/auth/hooks/useAuth.js";
import { useChatSession } from "../../features/chats/context/ChatSessionContext.jsx";
import { messagesKeys } from "../../features/messages/queryKeys.js";
import { chatsKeys } from "../../features/chats/queryKeys.js";
import "./chatBox.styles.scss";

const formatTime = (value) => {
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "";
  }
};

const deriveDisplayMessages = (pages) =>
  pages?.flatMap((page) => page.messages ?? []) ?? [];

const initialState = { convoId: null, messages: [] };

const reducer = (state, action) => {
  switch (action.type) {
    case "INIT_CONVO":
      if (action.convoId === state.convoId) {
        return state;
      }
      return { convoId: action.convoId, messages: action.history ?? [] };
    case "SET_HISTORY_ONCE":
      if (state.convoId !== action.convoId) {
        return state;
      }
      if (state.messages.length > 0) {
        return state;
      }
      return { ...state, messages: action.history ?? [] };
    case "APPEND":
      return { ...state, messages: [...state.messages, action.msg] };
    case "PATCH_LAST": {
      if (!state.messages.length) {
        return state;
      }
      const nextMessages = [...state.messages];
      nextMessages[nextMessages.length - 1] = {
        ...nextMessages[nextMessages.length - 1],
        ...action.patch,
      };
      return { ...state, messages: nextMessages };
    }
    default:
      return state;
  }
};

const useStableConvoId = (value) => useMemo(() => String(value ?? "default"), [value]);

const ChatBox = ({ daySummary }) => {
  const [activeChatId, setActiveChatId] = useState(null);
  const [message, setMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAnchorRef = useRef(null);
  const messagesViewportRef = useRef(null);

  const { data: user } = useCurrentUserQuery();
  const chatsQuery = useChatsQuery();
  const { setMessagesSetter } = useChatSession();
  const queryClient = useQueryClient();

  const createChatMutation = useCreateChatMutation({
    onSuccess: (chat) => {
      setActiveChatId((current) => current ?? chat.id);
    },
  });

  useEffect(() => {
    if (activeChatId || chatsQuery.isLoading) {
      return;
    }

    if (Array.isArray(chatsQuery.data) && chatsQuery.data.length > 0) {
      setActiveChatId(chatsQuery.data[0].id);
      return;
    }

    if (!createChatMutation.isPending) {
      createChatMutation.mutate({ title: "Pregnancy Assistant" });
    }
  }, [activeChatId, chatsQuery.data, chatsQuery.isLoading, createChatMutation]);

  const chatId = activeChatId;

  const messagesQuery = useInfiniteMessagesQuery(
    { chatId, initialPage: 0 },
    { enabled: Boolean(chatId) }
  );
  const { remove: removeMessagesQuery } = messagesQuery;

  const serverMessages = useMemo(
    () => deriveDisplayMessages(messagesQuery.data?.pages),
    [messagesQuery.data]
  );

  const convoId = useStableConvoId(chatId);
  const [state, dispatch] = useReducer(reducer, initialState);
  const messages = state.messages;

  const sendMessageMutation = useSendMessageMutation({ chatId });

  useEffect(() => {
    if (!setMessagesSetter) {
      return undefined;
    }

    const setter = () => {
      setActiveChatId(null);
      setMessage("");
      setShowScrollButton(false);
      removeMessagesQuery?.();
      queryClient.removeQueries({ queryKey: messagesKeys.all });
      queryClient.removeQueries({ queryKey: chatsKeys.list() });
    };

    setMessagesSetter(setter);
    return () => setMessagesSetter(null);
  }, [setMessagesSetter, removeMessagesQuery, queryClient]);

  useEffect(() => {
    if (!scrollAnchorRef.current) {
      return;
    }
    scrollAnchorRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    dispatch({ type: "INIT_CONVO", convoId, history: serverMessages });
  }, [convoId]);

  useEffect(() => {
    dispatch({ type: "SET_HISTORY_ONCE", convoId, history: serverMessages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMessages?.length, convoId]);

  useEffect(() => {
    if (state.convoId !== convoId) {
      return;
    }

    const history = serverMessages ?? [];
    if (history.length > messages.length) {
      history.slice(messages.length).forEach((entry) => {
        dispatch({ type: "APPEND", msg: entry });
      });
      return;
    }

    if (!history.length || history.length !== messages.length) {
      return;
    }

    const lastHistoryEntry = history[history.length - 1];
    const lastLocalEntry = messages[messages.length - 1];
    if (!lastHistoryEntry || !lastLocalEntry) {
      return;
    }

    const shareId = lastHistoryEntry.id && lastLocalEntry.id
      ? lastHistoryEntry.id === lastLocalEntry.id
      : (lastHistoryEntry.timestamp ?? lastHistoryEntry.createdAt) ===
          (lastLocalEntry.timestamp ?? lastLocalEntry.createdAt) &&
        lastHistoryEntry.role === lastLocalEntry.role;

    if (!shareId) {
      return;
    }

    const stringify = (value) =>
      value === undefined ? undefined : JSON.stringify(value);
    const hasDiff =
      lastHistoryEntry.content !== lastLocalEntry.content ||
      stringify(lastHistoryEntry.meta) !== stringify(lastLocalEntry.meta) ||
      lastHistoryEntry.error !== lastLocalEntry.error ||
      lastHistoryEntry.pending !== lastLocalEntry.pending;

    if (hasDiff) {
      dispatch({ type: "PATCH_LAST", patch: lastHistoryEntry });
    }
  }, [serverMessages, messages, convoId, state.convoId]);

  const handleViewportScroll = () => {
    if (!messagesViewportRef.current) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } =
      messagesViewportRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setShowScrollButton(!atBottom);
  };

  const scrollToBottom = () => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const quickPrompts = useMemo(
    () => [
      {
        id: "meal-plan",
        label: "Design me a meal plan",
        text:
          "Design a 1-day pregnancy-safe meal plan. Assume user provides weeks/days when asked. Include breakfast, lunch, dinner, 2 snacks, hydration targets, and simple prep notes. Consider common aversions and nausea. Avoid high-mercury fish, unpasteurized dairy, deli meats, and alcohol.",
      },
      {
        id: "health-tips",
        label: "Share health tips for me",
        text:
          "Share 3 concise, evidence-based pregnancy health tips for today. Cover movement, hydration/supplements, and rest. Add 1 red-flag symptom to watch and when to seek care. Keep it under 120 words total.",
      },
      {
        id: "relax",
        label: "Help me relax today",
        text:
          "Lead a 5-minute relaxation routine safe for pregnancy: brief breathwork (box or 4-7-8), a short body scan, and one simple stretch sequence with clear cues. Offer a 30-second TL;DR option.",
      },
    ],
    []
  );

  const onAction = (value) => setMessage(value);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sendMessageMutation.isPending || !chatId) {
      return;
    }

    const payload = {
      text: trimmed,
      dayData: daySummary
        ? {
            dayIndex: daySummary.day,
            babyUpdate: daySummary.babyUpdate,
            momUpdate: daySummary.momUpdate,
            tips: daySummary.tips,
          }
        : undefined,
    };

    setMessage("");
    sendMessageMutation.mutate(payload);
  };

  const renderMessage = (entry) => {
    const key = entry.id ?? `${entry.timestamp ?? entry.createdAt}-${entry.role}`;
    const tone = entry.meta?.triage ? "triage" : entry.role;

    return (
      <div key={key} className={`bubble bubble--${tone ?? "assistant"}`}>
        <div className="body">
          {entry.meta?.triage && <div className="flag">Important</div>}
          <p>{entry.content}</p>
        </div>
        <time className="time">{formatTime(entry.timestamp)}</time>
      </div>
    );
  };

  const isInitialising =
    chatsQuery.isLoading || createChatMutation.isPending || !chatId;
  const isSending = sendMessageMutation.isPending;

  return (
    <div className="container dark">
      <main
        className="messages"
        ref={messagesViewportRef}
        onScroll={handleViewportScroll}
      >
        {isInitialising && (
          <div className="bubble bubble--assistant">
            <div className="body">
              <div className="typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        {!isInitialising && messages.length === 0 && (
          <section className="welcome">
            <h1 className="headline">
              Hello, {user?.name?.split(" ")[0] || "there"}
            </h1>
            <div className="chips">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  className="chip"
                  onClick={() => onAction(prompt.text)}
                  type="button"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {messages.map(renderMessage)}

        {isSending && (
          <div className="bubble bubble--assistant">
            <div className="body">
              <div className="typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={scrollAnchorRef} />
      </main>

      {messagesQuery.hasNextPage && (
        <button
          className="scroll-btn show"
          type="button"
          onClick={() => messagesQuery.fetchNextPage()}
          disabled={messagesQuery.isFetchingNextPage}
        >
          {messagesQuery.isFetchingNextPage ? "Loading..." : "Load earlier"}
        </button>
      )}

      <button
        className={`scroll-btn ${showScrollButton ? "show" : ""}`}
        type="button"
        onClick={scrollToBottom}
        aria-label="Scroll to latest"
      >
        Scroll
      </button>

      <form className="composer" onSubmit={handleSubmit}>
        <div className="wrap">
          <div className="field">
            <input
              className="input"
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask Aya about your pregnancy..."
              disabled={isSending || !chatId}
            />
            <button
              className="send"
              type="submit"
              aria-label="Send message"
              title="Send message"
              disabled={!message.trim() || isSending || !chatId}
            >
              <FiSend aria-hidden="true" size={20} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
