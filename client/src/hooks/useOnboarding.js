import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyOnboarding, saveMyOnboarding } from "../services/onboarding";

const onboardingQueryKey = ["onboarding", "me"];

export const useMyOnboarding = () => {
  return useQuery({
    queryKey: onboardingQueryKey,
    queryFn: getMyOnboarding,
  });
};

export const useSaveOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveMyOnboarding,
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingQueryKey, data);
    },
  });
};
