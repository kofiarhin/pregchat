export const messagesKeys = {
  all: ["chatMessages"],
  list: ({ chatId, page }) => ["chatMessages", chatId, page],
};

export const chatMessageKeys = messagesKeys;
