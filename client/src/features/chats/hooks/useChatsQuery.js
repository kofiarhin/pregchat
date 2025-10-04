import { useQuery } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { chatsKeys } from "../queryKeys.js";
import { mapChatFromApi } from "../mappers.js";
import {
  loadChatsFromStorage,
  saveChatsToStorage,
} from "../storage.js";

const fetchChats = async () => {
  try {
    const response = await http.get("/chat/conversations");
    if (!response) {
      const stored = loadChatsFromStorage();
      return stored.map(mapChatFromApi);
    }

    const chats = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];

    const mapped = chats.map(mapChatFromApi);
    saveChatsToStorage(mapped);
    return mapped;
  } catch (error) {
    if (error?.status === 404) {
      const fallback = loadChatsFromStorage();
      return fallback.map(mapChatFromApi);
    }
    throw error;
  }
};

export const useChatsQuery = (options = {}) =>
  useQuery({
    queryKey: chatsKeys.list(),
    queryFn: fetchChats,
    staleTime: options.staleTime ?? 1000 * 60,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? true,
    ...options,
  });
