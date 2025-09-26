import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { store } from "../../../store/store.js";
import { enqueueToast } from "../../../store/ui/uiSlice.js";
import { chatsKeys } from "../../chats/queryKeys.js";
import { saveChatsToStorage } from "../../chats/storage.js";
import { messagesKeys } from "../queryKeys.js";

const createMessage = ({
  id,
  role,
  content,
  meta,
  optimistic = false,
}) => ({
  id: id ?? `${Date.now()}-${Math.random()}`,
  role,
  content,
  timestamp: new Date().toISOString(),
  optimistic,
  meta,
});

const appendToMessagesCache = (queryClient, chatId, message) => {
  queryClient.setQueryData(messagesKeys.infinite(chatId), (existing) => {
    if (!existing) {
      return {
        pageParams: [0],
        pages: [
          {
            page: 0,
            messages: [message],
            hasMore: false,
            total: 1,
          },
        ],
      };
    }

    const pages = existing.pages?.length
      ? existing.pages.map((page, index, arr) =>
          index === arr.length - 1
            ? {
                ...page,
                messages: [...(page.messages ?? []), message],
                total:
                  page.total !== undefined
                    ? page.total + 1
                    : (page.messages?.length ?? 0) + 1,
              }
            : page
        )
      : [
          {
            page: 0,
            messages: [message],
            hasMore: false,
            total: 1,
          },
        ];

    return {
      ...existing,
      pages,
      pageParams: existing.pageParams?.length
        ? existing.pageParams
        : [0],
    };
  });

  queryClient.setQueryData(
    messagesKeys.list({ chatId, page: 0 }),
    (existing) => {
      if (!existing) {
        return {
          page: 0,
          messages: [message],
          hasMore: false,
          total: 1,
        };
      }
      return {
        ...existing,
        messages: [...(existing.messages ?? []), message],
        total:
          existing.total !== undefined
            ? existing.total + 1
            : (existing.messages?.length ?? 0) + 1,
      };
    }
  );

  queryClient.setQueryData(chatsKeys.detail(chatId), (existing) => {
    if (!existing) {
      return {
        id: chatId,
        messages: [message],
        updatedAt: message.timestamp,
      };
    }
    const messages = [...(existing.messages ?? []), message];
    return {
      ...existing,
      messages,
      updatedAt: message.timestamp,
    };
  });

  queryClient.setQueryData(chatsKeys.list(), (existing) => {
    const list = Array.isArray(existing) ? [...existing] : [];
    if (!list.length) {
      return [
        {
          id: chatId,
          title: "PregChat",
          updatedAt: message.timestamp,
        },
      ];
    }
    return list
      .map((chat) =>
        chat.id === chatId
          ? { ...chat, updatedAt: message.timestamp }
          : chat
      )
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  });

  saveChatsToStorage((stored) => {
    const next = Array.isArray(stored) ? [...stored] : [];
    const index = next.findIndex((chat) => chat.id === chatId);
    if (index >= 0) {
      const messages = [...(next[index].messages ?? []), message];
      next[index] = { ...next[index], messages, updatedAt: message.timestamp };
    } else {
      next.push({
        id: chatId,
        title: "PregChat",
        messages: [message],
        updatedAt: message.timestamp,
      });
    }
    return next;
  });
};

const replaceMessageInCache = (queryClient, chatId, matcher, updater) => {
  const apply = (messages) =>
    (messages ?? []).map((item) => (matcher(item) ? updater(item) : item));

  queryClient.setQueryData(messagesKeys.infinite(chatId), (existing) => {
    if (!existing?.pages) {
      return existing;
    }
    const pages = existing.pages.map((page) => ({
      ...page,
      messages: apply(page.messages),
    }));
    return { ...existing, pages };
  });

  queryClient.setQueryData(
    messagesKeys.list({ chatId, page: 0 }),
    (existing) =>
      existing
        ? {
            ...existing,
            messages: apply(existing.messages),
          }
        : existing
  );

  queryClient.setQueryData(chatsKeys.detail(chatId), (existing) =>
    existing
      ? {
          ...existing,
          messages: apply(existing.messages),
        }
      : existing
  );

  saveChatsToStorage((stored) => {
    const next = Array.isArray(stored) ? [...stored] : [];
    const index = next.findIndex((chat) => chat.id === chatId);
    if (index >= 0) {
      next[index] = {
        ...next[index],
        messages: apply(next[index].messages),
      };
    }
    return next;
  });
};

const removeMessageFromCache = (queryClient, chatId, predicate) => {
  const filterMessages = (messages) =>
    (messages ?? []).filter((item) => !predicate(item));

  queryClient.setQueryData(messagesKeys.infinite(chatId), (existing) => {
    if (!existing?.pages) {
      return existing;
    }
    const pages = existing.pages.map((page) => ({
      ...page,
      messages: filterMessages(page.messages),
    }));
    return { ...existing, pages };
  });

  queryClient.setQueryData(
    messagesKeys.list({ chatId, page: 0 }),
    (existing) =>
      existing
        ? {
            ...existing,
            messages: filterMessages(existing.messages),
            total: Math.max(
              0,
              (existing.total ?? existing.messages?.length ?? 0) - 1
            ),
          }
        : existing
  );

  queryClient.setQueryData(chatsKeys.detail(chatId), (existing) => {
    if (!existing) {
      return existing;
    }
    const messages = filterMessages(existing.messages);
    return {
      ...existing,
      messages,
    };
  });

  saveChatsToStorage((stored) => {
    const next = Array.isArray(stored) ? [...stored] : [];
    const index = next.findIndex((chat) => chat.id === chatId);
    if (index >= 0) {
      next[index] = {
        ...next[index],
        messages: filterMessages(next[index].messages),
      };
    }
    return next;
  });
};

export const useSendMessageMutation = ({ chatId }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, dayData, stream = false }) => {
      const endpoint = stream ? "/chat/ask?stream=1" : "/chat/ask";
      const payload = {
        text,
        ...(dayData ? { dayData } : {}),
        ...(stream ? { stream: true } : {}),
      };
      const response = await http.post(endpoint, { json: payload });
      return response;
    },
    onMutate: async ({ text }) => {
      if (!chatId) {
        throw new Error("chatId is required to send messages");
      }
      await queryClient.cancelQueries({ queryKey: messagesKeys.infinite(chatId) });
      await queryClient.cancelQueries({
        queryKey: messagesKeys.list({ chatId, page: 0 }),
      });

      const userMessage = createMessage({
        role: "user",
        content: text,
        optimistic: true,
      });

      appendToMessagesCache(queryClient, chatId, userMessage);

      return { userMessage };
    },
    onSuccess: (data, variables, context) => {
      const assistantContent = data?.content || data?.message;
      const isTriage = Boolean(data?.triage);
      const assistantMessage = createMessage({
        role: "assistant",
        content:
          assistantContent ||
          "I\"m not sure how to respond right now, but I\"m here for you.",
        meta: isTriage ? { triage: true } : undefined,
      });

      if (context?.userMessage) {
        replaceMessageInCache(
          queryClient,
          chatId,
          (message) => message.id === context.userMessage.id,
          (message) => ({ ...message, optimistic: false })
        );
      }

      appendToMessagesCache(queryClient, chatId, assistantMessage);

      if (isTriage) {
        store.dispatch(
          enqueueToast({
            message: "We\"ve flagged your message. Please review the guidance.",
            tone: "warning",
          })
        );
      }
    },
    onError: (error, variables, context) => {
      if (context?.userMessage) {
        removeMessageFromCache(
          queryClient,
          chatId,
          (message) => message.id === context.userMessage.id
        );
      }
      store.dispatch(
        enqueueToast({
          message: error?.message || "Failed to send message",
          tone: "error",
        })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: messagesKeys.infinite(chatId),
      });
      queryClient.invalidateQueries({
        queryKey: messagesKeys.list({ chatId, page: 0 }),
      });
      queryClient.invalidateQueries({ queryKey: chatsKeys.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
    },
  });
};
