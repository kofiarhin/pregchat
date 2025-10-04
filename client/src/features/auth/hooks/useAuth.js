import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { store, useAppSelector } from "../../../store/store.js";
import {
  clearAuthToken,
  enqueueToast,
  selectAuthToken,
  setAuthToken,
} from "../../../store/ui/uiSlice.js";
import { authKeys } from "../queryKeys.js";
import { loadStoredUser, saveStoredUser } from "../storage.js";

const extractUser = (payload) => payload?.user ?? payload;

const fetchCurrentUser = async () => {
  const response = await http.get("/auth/me");
  const user = extractUser(response);
  saveStoredUser(user);
  return user;
};

export const useCurrentUserQuery = (options = {}) => {
  const token = useAppSelector(selectAuthToken);
  const initialData = token ? loadStoredUser() : null;
  const {
    enabled: enabledOption = true,
    onError: onErrorOption,
    onSuccess: onSuccessOption,
    staleTime = 1000 * 60 * 5,
    gcTime = 1000 * 60 * 30,
    retry = 1,
    ...restOptions
  } = options;

  const enabled = Boolean(token) && enabledOption;

  return useQuery({
    queryKey: authKeys.user(),
    queryFn: fetchCurrentUser,
    initialData,
    staleTime,
    gcTime,
    retry,
    enabled,
    ...restOptions,
    onError: (error) => {
      if (error?.status === 401) {
        store.dispatch(clearAuthToken());
        saveStoredUser(null);
      }
      onErrorOption?.(error);
    },
    onSuccess: (data) => {
      saveStoredUser(data);
      onSuccessOption?.(data);
    },
  });
};

const authenticate = async ({ path, body }) => {
  const response = await http.post(path, { json: body });
  const token = response?.token;
  const user = extractUser(response);
  if (!token) {
    throw new Error("Authentication token missing in response");
  }
  store.dispatch(setAuthToken(token));
  saveStoredUser(user);
  return { token, user };
};

export const useLoginMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }) =>
      authenticate({ path: "/auth/login", body: { email, password } }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authKeys.user(), user);
      options.onSuccess?.({ user });
    },
    onError: (error) => {
      store.dispatch(
        enqueueToast({
          message: error?.message || "Failed to login",
          tone: "error",
        })
      );
      options.onError?.(error);
    },
  });
};

export const useRegisterMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, email, password, region }) =>
      authenticate({
        path: "/auth/register",
        body: { name, email, password, region },
      }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authKeys.user(), user);
      options.onSuccess?.({ user });
    },
    onError: (error) => {
      store.dispatch(
        enqueueToast({
          message: error?.message || "Failed to register",
          tone: "error",
        })
      );
      options.onError?.(error);
    },
  });
};

export const useLogoutMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      store.dispatch(clearAuthToken());
      saveStoredUser(null);
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
    onSuccess: () => {
      options.onSuccess?.();
    },
  });
};
