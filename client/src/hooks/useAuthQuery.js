import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "../store/store";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
} from "../store/slices/authSlice";
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

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      dispatch(loginStart());
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data));
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      dispatch(loginFailure(error.message));
    },
  });
};

export const useRegister = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, email, password, region }) => {
      dispatch(loginStart());
      return request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, region }),
      });
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data));
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      dispatch(loginFailure(error.message));
    },
  });
};

export const useMe = () => {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: ["user"],
    queryFn: () => request("/auth/me"),
    enabled: !!localStorage.getItem("token"),
    onSuccess: (data) => {
      dispatch(setUser(data.user));
    },
    onError: () => {
      dispatch(logout());
    },
  });
};
