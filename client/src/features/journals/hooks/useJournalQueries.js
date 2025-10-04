import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { journalKeys } from "../queryKeys.js";

const buildListPath = (userId) => {
  const params = new URLSearchParams();

  if (userId) {
    params.set("userId", userId);
  }

  const query = params.toString();

  return query ? `/api/journals?${query}` : "/api/journals";
};

export const useJournalsQuery = (userId, options = {}) => {
  return useQuery({
    queryKey: journalKeys.list(userId),
    enabled: Boolean(userId) && (options.enabled ?? true),
    queryFn: async () => {
      const response = await http.get(buildListPath(userId));
      return Array.isArray(response) ? response : [];
    },
    ...options,
  });
};

export const useJournalQuery = (id, userId, options = {}) => {
  return useQuery({
    queryKey: journalKeys.detail(id),
    enabled: Boolean(id && userId) && (options.enabled ?? true),
    queryFn: async () => {
      if (!id || !userId) {
        return null;
      }

      const params = new URLSearchParams({ userId });
      return http.get(`/api/journals/${id}?${params.toString()}`);
    },
    ...options,
  });
};

export const useCreateJournalMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, title, content, date }) => {
      const payload = { userId, title, content };

      if (date) {
        payload.date = date;
      }

      return http.post("/api/journals", { json: payload });
    },
    onSuccess: (data, variables, context) => {
      if (variables?.userId) {
        queryClient.invalidateQueries({
          queryKey: journalKeys.list(variables.userId),
        });
      }

      if (data?._id) {
        queryClient.setQueryData(journalKeys.detail(data._id), data);
      }

      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
  });
};

export const useUpdateJournalMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId, title, content }) => {
      return http.put(`/api/journals/${id}`, {
        json: { userId, title, content },
      });
    },
    onSuccess: (data, variables, context) => {
      if (variables?.userId) {
        queryClient.invalidateQueries({
          queryKey: journalKeys.list(variables.userId),
        });
      }

      if (variables?.id) {
        queryClient.setQueryData(journalKeys.detail(variables.id), data);
      }

      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
  });
};

export const useDeleteJournalMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }) => {
      const params = new URLSearchParams();

      if (userId) {
        params.set("userId", userId);
      }

      const query = params.toString();
      const path = query ? `/api/journals/${id}?${query}` : `/api/journals/${id}`;

      await http.delete(path);

      return { id, userId };
    },
    onSuccess: (data, variables, context) => {
      if (variables?.userId) {
        queryClient.invalidateQueries({
          queryKey: journalKeys.list(variables.userId),
        });
      }

      if (variables?.id) {
        queryClient.removeQueries({
          queryKey: journalKeys.detail(variables.id),
        });
      }

      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
  });
};
