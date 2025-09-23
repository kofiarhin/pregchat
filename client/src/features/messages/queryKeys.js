export const messagesKeys = {
  all: ["messages"],
  list: ({ chatId, page = 0 }) => ["messages", { chatId, page }],
  infinite: (chatId) => ["messages", { chatId, mode: "infinite" }],
};
