import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { chatsKeys } from "../queryKeys.js";
import { mapChatDetailFromApi } from "../mappers.js";
import {
  loadChatsFromStorage,
  saveChatsToStorage,
} from "../storage.js";

const updateStoredChat = (chat) => {
  const current = loadChatsFromStorage();
  const next = Array.isArray(current) ? [...current] : [];
  const index = next.findIndex((item) => item.id === chat.id);
  if (index >= 0) {
    next[index] = chat;
  } else {
    next.push(chat);
  }
  saveChatsToStorage(next);
};

const applyLocalUpdate = ({ chatId, data }) => {
  const current = loadChatsFromStorage();
  const next = Array.isArray(current) ? [...current] : [];
  const index = next.findIndex((item) => item.id === chatId);
  if (index < 0) {
    return null;
  }
  const updated = {
    ...next[index],
    ...data,
    updatedAt: data?.updatedAt || new Date().toISOString(),
  };
  next[index] = updated;
  saveChatsToStorage(next);
  return updated;
};

export const useUpdateChatMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, data }) => {
      if (!chatId) {
        throw new Error("chatId is required to update a chat");
      }

      try {
        const response = await http.patch(`/chat/conversations/${chatId}`, {
          json: data,
        });
        const mapped = mapChatDetailFromApi(response?.data ?? response ?? {});
        updateStoredChat(mapped);
        return mapped;
      } catch (error) {
        if (error?.status === 404) {
          const fallback = applyLocalUpdate({ chatId, data });
          if (!fallback) {
            throw error;
          }
          return fallback;
        }
        throw error;
      }
    },
    onSuccess: (chat) => {
      queryClient.setQueryData(chatsKeys.list(), (existing) => {
        const list = Array.isArray(existing) ? existing : [];
        return list.map((item) => (item.id === chat.id ? { ...item, ...chat } : item));
      });
      queryClient.setQueryData(chatsKeys.detail(chat.id), chat);
      options.onSuccess?.(chat);
    },
    ...options,
  });
};
