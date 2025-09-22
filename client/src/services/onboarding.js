import { API_BASE } from "../constants/baseUrl";

const withAuth = (options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    ...options,
    headers,
  };
};

const parseResponse = async (response, { allowNotFound = false } = {}) => {
  if (allowNotFound && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ error: "Unable to process the request." }));
    const error = new Error(body.error || "Request failed");
    error.status = response.status;
    throw error;
  }

  return response.json();
};

export const getMyOnboarding = async () => {
  const response = await fetch(
    `${API_BASE}/api/onboarding/me`,
    withAuth()
  );

  return parseResponse(response, { allowNotFound: true });
};

export const saveMyOnboarding = async (payload) => {
  const response = await fetch(
    `${API_BASE}/api/onboarding/me`,
    withAuth({
      method: "POST",
      body: JSON.stringify(payload),
    })
  );

  return parseResponse(response);
};
