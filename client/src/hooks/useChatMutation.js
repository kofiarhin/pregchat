import { useMutation } from "@tanstack/react-query";
import { http } from "../api/http";

const askQuestion = async (questionData) => {
  const { text, conversationId } = questionData;
  const body = { text };
  if (conversationId) {
    body.conversationId = conversationId;
  }
  const res = await http.post("/api/chat", { json: body });
  return res;
};

const useChatMutation = (options = {}) => {
  return useMutation({
    mutationKey: ["chat"],
    mutationFn: (data) => askQuestion(data),
    onSuccess: (data) => {
      // If the server auto-created a new thread (fallback path), notify the caller
      if (data?.conversationId && typeof options?.onNewThread === "function") {
        options.onNewThread(String(data.conversationId));
      }
    },
  });
};

export default useChatMutation;
