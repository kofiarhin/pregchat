import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "../store/store";
import {
  setPregnancyProfile,
  setLoading,
  setError,
} from "../store/slices/pregnancySlice";
import { API_BASE } from "../constants/baseUrl";

const request = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Network error" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
};

export const useGetToday = () => {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: ["today"],
    queryFn: () => request("/updates/today"),
    enabled: !!localStorage.getItem("token"),
    onSuccess: (data) => {
      dispatch(
        setPregnancyProfile({
          dayIndex: data.day,
          lmpDate: null, // Will be set from profile
          dueDate: null,
        })
      );
    },
    onError: (error) => {
      dispatch(setError(error.message));
    },
  });
};

export const useGetDay = (day) => {
  return useQuery({
    queryKey: ["day", day],
    queryFn: () => request(`/updates/${day}`),
    enabled: !!day && !!localStorage.getItem("token"),
  });
};

export const useUpdateProfile = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lmpDate, dueDate }) => {
      dispatch(setLoading(true));
      return request("/updates/profile", {
        method: "PUT",
        body: JSON.stringify({ lmpDate, dueDate }),
      });
    },
    onSuccess: (data) => {
      dispatch(
        setPregnancyProfile({
          dayIndex: data.dayIndex,
          lmpDate: data.lmpDate,
          dueDate: data.dueDate,
        })
      );
      queryClient.invalidateQueries({ queryKey: ["today"] });
      dispatch(setLoading(false));
    },
    onError: (error) => {
      dispatch(setError(error.message));
    },
  });
};
