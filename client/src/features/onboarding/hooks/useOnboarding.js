import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { onboardingKeys } from "../queryKeys.js";

const mapOnboarding = (payload) => ({
  dueDateOrPregnancyWeek: payload?.dueDateOrPregnancyWeek ?? "",
  babyGender: payload?.babyGender ?? "",
  healthConsiderations: payload?.healthConsiderations ?? "",
  updateFrequency: payload?.updateFrequency ?? "",
  isFirstPregnancy: payload?.isFirstPregnancy ?? null,
});

export const useOnboardingQuery = (options = {}) =>
  useQuery({
    queryKey: onboardingKeys.me(),
    queryFn: async () => {
      try {
        const response = await http.get("/api/onboarding/me");
        return response ? mapOnboarding(response) : null;
      } catch (error) {
        if (error?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    ...options,
  });

export const useSaveOnboardingMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input) => {
      const response = await http.post("/api/onboarding/me", { json: input });
      return mapOnboarding(response);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.me(), data);
      options.onSuccess?.(data);
    },
    ...options,
  });
};

