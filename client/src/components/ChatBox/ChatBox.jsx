import React, { useEffect, useMemo, useRef, useState } from "react";
import { useChatsQuery } from "../../features/chats/hooks/useChatsQuery.js";
import { useCreateChatMutation } from "../../features/chats/hooks/useCreateChatMutation.js";
import { useInfiniteMessagesQuery } from "../../features/messages/hooks/useInfiniteMessagesQuery.js";
import { useSendMessageMutation } from "../../features/messages/hooks/useSendMessageMutation.js";
import { useCurrentUserQuery } from "../../features/auth/hooks/useAuth.js";
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

const ChatBox = ({ daySummary }) => {
  const [activeChatId, setActiveChatId] = useState(null);
  const [message, setMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAnchorRef = useRef(null);
  const messagesViewportRef = useRef(null);

  const { data: user } = useCurrentUserQuery();
  const chatsQuery = useChatsQuery();

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

  const messages = useMemo(
    () => deriveDisplayMessages(messagesQuery.data?.pages),
    [messagesQuery.data]
  );

  const sendMessageMutation = useSendMessageMutation({ chatId });

  useEffect(() => {
    if (!scrollAnchorRef.current) {
      return;
    }
    scrollAnchorRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessageMutation.isPending]);

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

  const quickPrompts = useMemo(() => {
    const weekLabel = daySummary?.day
      ? Math.ceil(Number(daySummary.day) / 7)
      : "your pregnancy";
    return [
      {
        id: "inspire",
        label: "Inspire me",
        text: `What should I focus on today for week ${weekLabel}?`,
      },
      {
        id: "checklist",
        label: "Save me time",
        text: "Give me a quick wellness checklist for today.",
      },
      {
        id: "support",
        label: "What you can do",
        text: "What support can you offer for pregnancy questions?",
      },
    ];
  }, [daySummary]);

  const selectQuickPrompt = (value) => setMessage(value);

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

  const renderMessage = (entry, index) => {
    const key = `${entry.id}-${index}`;
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
                  onClick={() => selectQuickPrompt(prompt.text)}
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
              disabled={!message.trim() || isSending || !chatId}
            >
              {isSending ? "..." : "Send"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
