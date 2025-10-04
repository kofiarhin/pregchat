export const mapChatFromApi = (payload) => ({
  id: payload?.id || payload?._id || payload?.chatId || "",
  title: payload?.title || payload?.name || "Untitled chat",
  updatedAt: payload?.updatedAt || payload?.lastMessageAt || new Date().toISOString(),
  createdAt: payload?.createdAt || payload?.created_on || new Date().toISOString(),
});

export const mapChatDetailFromApi = (payload) => ({
  ...mapChatFromApi(payload),
  messages: Array.isArray(payload?.messages)
    ? payload.messages.map((message) => ({
        id: message?.id || message?._id || `${Date.now()}-${Math.random()}`,
        role: message?.role || message?.author || "assistant",
        content: message?.content || message?.text || "",
        timestamp: message?.timestamp || message?.createdAt || new Date().toISOString(),
      }))
    : [],
});
