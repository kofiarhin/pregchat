import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatMessageKeys } from "../queryKeys.js";
import {
  loadChatHistory,
  saveChatHistory,
  clearChatHistory as clearLocalAndServer,
} from "../../../utils/chatHistory.js";

/**
 * TanStack Query-powered local chat messages state backed by localStorage.
 * - Query: loads messages from localStorage
 * - Mutations: append messages, clear messages (also clears on server if userId provided)
 */
export const useChatMessages = () => {
  const queryClient = useQueryClient();

  // Source of truth for messages
  const { data: messages = [] } = useQuery({
    queryKey: chatMessageKeys.all,
    queryFn: () => loadChatHistory(),
    initialData: () => loadChatHistory(),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Append one or many messages
  const appendMutation = useMutation({
    mutationFn: async (toAppend) => {
      const list = Array.isArray(toAppend) ? toAppend : [toAppend];
      const current = queryClient.getQueryData(chatMessageKeys.all) ?? [];
      const next = [...current, ...list];
      saveChatHistory(next);
      return next;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(chatMessageKeys.all, next);
    },
  });

  // Clear messages locally (and optionally on server if userId provided)
  const clearMutation = useMutation({
    mutationFn: async (userId) => {
      await clearLocalAndServer(undefined, userId ?? null);
      const empty = [];
      saveChatHistory(empty);
      return empty;
    },
    onSuccess: (empty) => {
      queryClient.setQueryData(chatMessageKeys.all, empty);
    },
  });

  return {
    messages,
    appendMessages: appendMutation.mutateAsync,
    isAppending: appendMutation.isPending,
    clearMessages: clearMutation.mutateAsync,
    isClearing: clearMutation.isPending,
  };
};
