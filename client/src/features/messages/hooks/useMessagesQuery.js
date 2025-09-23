import { useQuery } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { messagesKeys } from "../queryKeys.js";
import {
  loadChatsFromStorage,
  saveChatsToStorage,
} from "../../chats/storage.js";
import { mapChatDetailFromApi } from "../../chats/mappers.js";

const PAGE_SIZE = 20;

const mapMessage = (payload) => ({
  id: payload?.id || payload?._id || `${Date.now()}-${Math.random()}`,
  role: payload?.role || payload?.author || "assistant",
  content: payload?.content || payload?.text || "",
  timestamp: payload?.timestamp || payload?.createdAt || new Date().toISOString(),
});

const sliceFromStoredChat = (chatId, page) => {
  const chats = loadChatsFromStorage();
  const chat = chats.find((item) => item.id === chatId);
  const messages = Array.isArray(chat?.messages) ? chat.messages : [];
  const start = page * PAGE_SIZE;
  const sliced = messages.slice(start, start + PAGE_SIZE).map(mapMessage);
  const hasMore = start + PAGE_SIZE < messages.length;
  return {
    page,
    messages: sliced,
    hasMore,
    total: messages.length,
  };
};

export const fetchMessagesPage = async ({ chatId, page }) => {
  if (!chatId) {
    return { page, messages: [], hasMore: false, total: 0 };
  }

  try {
    const search = new URLSearchParams({
      page: String(page ?? 0),
      limit: String(PAGE_SIZE),
    }).toString();
    const response = await http.get(
      `/chat/conversations/${chatId}/messages?${search}`
    );
    const payload = response?.data ?? response ?? {};
    const messages = Array.isArray(payload?.messages)
      ? payload.messages.map(mapMessage)
      : [];

    if (payload?.chat || payload?.allMessages) {
      const detail = mapChatDetailFromApi({
        ...payload.chat,
        id: chatId,
        messages: payload.allMessages ?? [],
      });
      const stored = loadChatsFromStorage();
      const next = Array.isArray(stored) ? [...stored] : [];
      const index = next.findIndex((item) => item.id === detail.id);
      const merged = { ...detail };
      if (index >= 0) {
        next[index] = merged;
      } else {
        next.push(merged);
      }
      saveChatsToStorage(next);
    }

    return {
      page,
      messages,
      hasMore: Boolean(payload?.hasMore),
      total: payload?.total ?? messages.length,
    };
  } catch (error) {
    if (error?.status === 404) {
      return sliceFromStoredChat(chatId, page ?? 0);
    }
    throw error;
  }
};

export const useMessagesQuery = (
  { chatId, page = 0 },
  options = {}
) =>
  useQuery({
    queryKey: messagesKeys.list({ chatId, page }),
    queryFn: () => fetchMessagesPage({ chatId, page }),
    enabled: options.enabled ?? Boolean(chatId),
    staleTime: options.staleTime ?? 1000 * 15,
    ...options,
  });
