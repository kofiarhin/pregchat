import { useMutation } from "@tanstack/react-query";
import { API_BASE } from "../constants/baseUrl";

export const useAsk = () => {
  return useMutation({
    mutationFn: async ({ text, dayData, stream = false }) => {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const body = { text };
      if (dayData) {
        body.dayData = dayData;
      }

      if (stream) {
        body.stream = true;
      }

      const response = await fetch(
        `${API_BASE}/chat/ask${stream ? "?stream=1" : ""}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Network error" }));
        throw new Error(error.error || "Request failed");
      }

      if (stream) {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          result += chunk;
        }

        return result;
      } else {
        return response.json();
      }
    },
  });
};
