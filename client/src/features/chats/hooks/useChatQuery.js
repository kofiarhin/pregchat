import { useQuery } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { chatsKeys } from "../queryKeys.js";
import { mapChatDetailFromApi } from "../mappers.js";
import {
  loadChatsFromStorage,
  saveChatsToStorage,
} from "../storage.js";

const upsertStoredChat = (chat) => {
  const current = loadChatsFromStorage();
  const next = Array.isArray(current) ? [...current] : [];
  const index = next.findIndex((item) => item.id === chat.id);
  if (index >= 0) {
    next[index] = { ...next[index], ...chat };
  } else {
    next.push(chat);
  }
  saveChatsToStorage(next);
};

const fetchChatById = async (chatId) => {
  if (!chatId) {
    return null;
  }

  try {
    const response = await http.get(`/chat/conversations/${chatId}`);
    const mapped = mapChatDetailFromApi(response?.data ?? response ?? {});
    upsertStoredChat(mapped);
    return mapped;
  } catch (error) {
    if (error?.status === 404) {
      const stored = loadChatsFromStorage();
      const found = stored.find((chat) => chat.id === chatId);
      return found ? mapChatDetailFromApi(found) : null;
    }
    throw error;
  }
};

export const useChatQuery = (chatId, options = {}) =>
  useQuery({
    queryKey: chatsKeys.detail(chatId),
    queryFn: () => fetchChatById(chatId),
    enabled: options.enabled ?? Boolean(chatId),
    staleTime: options.staleTime ?? 1000 * 30,
    ...options,
  });
