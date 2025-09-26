import { useInfiniteQuery } from "@tanstack/react-query";
import { messagesKeys } from "../queryKeys.js";
import { fetchMessagesPage } from "./useMessagesQuery.js";

export const useInfiniteMessagesQuery = (
  { chatId, initialPage = 0 },
  options = {}
) =>
  useInfiniteQuery({
    queryKey: messagesKeys.infinite(chatId),
    initialPageParam: initialPage,
    queryFn: ({ pageParam }) =>
      fetchMessagesPage({ chatId, page: pageParam ?? initialPage }),
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? (lastPage.page ?? 0) + 1 : undefined,
    enabled: options.enabled ?? Boolean(chatId),
    ...options,
  });
