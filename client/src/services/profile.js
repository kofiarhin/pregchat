import { API_BASE_URL } from "../../constants/api.js";

const handleResponse = async (response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Profile request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const buildJsonOptions = (method, payload) => ({
  method,
  credentials: "include",
  headers: {
    "Content-Type": "application/json"
  },
  body: payload ? JSON.stringify(payload) : undefined
});

export const getMyProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
    credentials: "include"
  });
  return handleResponse(response);
};

export const createMyProfile = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/api/profile`, buildJsonOptions("POST", payload));
  return handleResponse(response);
};

export const updateProfile = async (profileId, payload) => {
  if (!profileId) {
    throw new Error("Profile id is required");
  }

  const response = await fetch(`${API_BASE_URL}/api/profile/${profileId}`, buildJsonOptions("PATCH", payload));
  return handleResponse(response);
};

export const updateProfileField = updateProfile;
