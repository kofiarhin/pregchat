import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { chatsKeys } from "../queryKeys.js";
import {
  loadChatsFromStorage,
  saveChatsToStorage,
} from "../storage.js";

const removeStoredChat = (chatId) => {
  const current = loadChatsFromStorage();
  const next = Array.isArray(current)
    ? current.filter((chat) => chat.id !== chatId)
    : [];
  saveChatsToStorage(next);
  return next;
};

export const useDeleteChatMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId) => {
      if (!chatId) {
        throw new Error("chatId is required to delete a chat");
      }

      try {
        await http.delete(`/chat/conversations/${chatId}`);
        removeStoredChat(chatId);
        return chatId;
      } catch (error) {
        if (error?.status === 404) {
          removeStoredChat(chatId);
          return chatId;
        }
        throw error;
      }
    },
    onSuccess: (chatId) => {
      queryClient.setQueryData(chatsKeys.list(), (existing) => {
        const list = Array.isArray(existing) ? existing : [];
        return list.filter((chat) => chat.id !== chatId);
      });
      queryClient.removeQueries({ queryKey: chatsKeys.detail(chatId) });
      options.onSuccess?.(chatId);
    },
    ...options,
  });
};
