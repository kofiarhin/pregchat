import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { pregnancyKeys } from "../queryKeys.js";

const mapUpdate = (payload) => ({
  day: payload?.day ?? payload?.dayIndex ?? null,
  babyUpdate: payload?.babyUpdate ?? "",
  momUpdate: payload?.momUpdate ?? "",
  tips: payload?.tips ?? "",
  assets: payload?.assets ?? [],
  references: payload?.references ?? [],
});

export const useTodayPregnancyQuery = (options = {}) =>
  useQuery({
    queryKey: pregnancyKeys.today(),
    queryFn: async () => {
      const response = await http.get("/updates/today", { credentials: "omit" });
      return mapUpdate(response);
    },
    staleTime: options.staleTime ?? 1000 * 60,
    ...options,
  });

export const usePregnancyProfileQuery = (options = {}) =>
  useQuery({
    queryKey: pregnancyKeys.profile(),
    queryFn: async () => {
      try {
        return await http.get("/updates/profile");
      } catch (error) {
        if (error?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    ...options,
  });

export const usePregnancyDayQuery = (day, options = {}) =>
  useQuery({
    queryKey: pregnancyKeys.day(day),
    queryFn: async () => {
      const response = await http.get(`/updates/${day}`);
      return mapUpdate(response);
    },
    enabled: options.enabled ?? Boolean(day),
    staleTime: options.staleTime ?? 1000 * 60 * 5,
    ...options,
  });

export const useUpdatePregnancyProfileMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mode, lmpDate, dueDate }) => {
      const payload =
        mode === "lmp"
          ? { lmpDate, dueDate: "" }
          : { dueDate, lmpDate: "" };

      const response = await http.put("/updates/profile", { json: payload });
      return {
        lmpDate: response?.lmpDate ?? null,
        dueDate: response?.dueDate ?? null,
        dayIndex: response?.dayIndex ?? response?.day ?? null,
        updatedAt: response?.updatedAt ?? null,
      };
    },
    onSuccess: (data) => {
      if (data.dayIndex != null) {
        queryClient.setQueryData(pregnancyKeys.today(), (current) => ({
          ...(current ?? {}),
          day: data.dayIndex,
        }));
        queryClient.invalidateQueries({
          queryKey: pregnancyKeys.day(data.dayIndex),
        });
      }
      queryClient.setQueryData(pregnancyKeys.profile(), (current) => ({
        ...(current ?? {}),
        lmpDate: data.lmpDate ?? null,
        dueDate: data.dueDate ?? null,
        dayIndex: data.dayIndex ?? null,
        updatedAt: data.updatedAt ?? current?.updatedAt ?? null,
      }));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      options.onSuccess?.(data);
    },
    ...options,
  });
};

export const useResetPregnancyProfileMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await http.delete("/updates/profile");
    },
    onSuccess: () => {
      queryClient.setQueryData(pregnancyKeys.profile(), null);
      queryClient.invalidateQueries({ queryKey: pregnancyKeys.today() });
      options.onSuccess?.();
    },
    ...options,
  });
};

