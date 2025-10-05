import { useMutation } from "@tanstack/react-query";
import { http } from "../api/http";

const askQuestion = async (questionData) => {
  const { text } = questionData;
  const res = await http.post("/api/chat", {
    json: { text },
  });
  return res;
};
const useChatMutation = () => {
  return useMutation({
    mutationKey: ["chat"],
    mutationFn: (data) => askQuestion(data),
    onSuccess: (data) => {
      console.log("question asked successfully!!!");
    },
  });
};

export default useChatMutation;
