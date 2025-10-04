export const journalKeys = {
  all: ["journals"],
  list: (userId) => ["journals", "list", userId],
  detail: (id) => ["journals", "detail", id],
};
