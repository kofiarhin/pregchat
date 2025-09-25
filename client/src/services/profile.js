export const updateProfileField = async (profileId, payload) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const response = await fetch(`${baseUrl}/api/profile/${profileId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to update profile");
  }

  return response.json();
};
