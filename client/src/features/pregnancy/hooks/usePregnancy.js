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
      const response = await http.get("/updates/today", { credentials: false });
      return mapUpdate(response);
    },
    staleTime: options.staleTime ?? 1000 * 60,
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
    mutationFn: async ({ lmpDate, dueDate, weeks, days }) => {
      const response = await http.put("/updates/profile", {
        json: { lmpDate, dueDate, weeks, days },
      });
      return {
        lmpDate: response?.lmpDate ?? null,
        dueDate: response?.dueDate ?? null,
        day: response?.dayIndex ?? response?.day ?? null,
      };
    },
    onSuccess: (data) => {
      if (data.day != null) {
        queryClient.setQueryData(pregnancyKeys.today(), (current) => ({
          ...(current ?? {}),
          day: data.day,
        }));
        queryClient.invalidateQueries({
          queryKey: pregnancyKeys.day(data.day),
        });
      }
      queryClient.invalidateQueries({ queryKey: pregnancyKeys.profile() });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      options.onSuccess?.(data);
    },
    ...options,
  });
};
