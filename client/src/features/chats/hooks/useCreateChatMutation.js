import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { chatsKeys } from "../queryKeys.js";
import { mapChatDetailFromApi } from "../mappers.js";
import {
  loadChatsFromStorage,
  saveChatsToStorage,
  generateChatId,
} from "../storage.js";

const createLocalChat = (input = {}) => {
  const now = new Date().toISOString();
  return {
    id: generateChatId(),
    title: input.title || "New conversation",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
};

const persistChat = (chat) => {
  const current = loadChatsFromStorage();
  const next = Array.isArray(current) ? [...current] : [];
  next.push(chat);
  saveChatsToStorage(next);
};

export const useCreateChatMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload = {}) => {
      try {
        const response = await http.post("/chat/conversations", { json: payload });
        const mapped = mapChatDetailFromApi(response?.data ?? response ?? {});
        persistChat(mapped);
        return mapped;
      } catch (error) {
        if (error?.status === 404) {
          const localChat = createLocalChat(payload);
          persistChat(localChat);
          return localChat;
        }
        throw error;
      }
    },
    onSuccess: (chat) => {
      queryClient.setQueryData(chatsKeys.list(), (existing) => {
        const list = Array.isArray(existing) ? existing : [];
        return [chat, ...list.filter((item) => item.id !== chat.id)];
      });
      queryClient.setQueryData(chatsKeys.detail(chat.id), chat);
      options.onSuccess?.(chat);
    },
    ...options,
  });
};
