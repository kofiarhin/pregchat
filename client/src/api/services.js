import { API_BASE } from "../constants/baseUrl";

export const request = async (path, options = {}) => {
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

// Auth services
export const login = (credentials) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

export const register = (userData) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const getMe = () => request("/auth/me");

// Pregnancy services
export const getToday = () => request("/updates/today");
export const getDay = (day) => request(`/updates/${day}`);
export const updateProfile = (profileData) =>
  request("/updates/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });

// Chat services
export const askChat = (chatData) =>
  request("/chat/ask", {
    method: "POST",
    body: JSON.stringify(chatData),
  });
