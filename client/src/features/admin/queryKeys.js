export const adminKeys = {
  all: ["admin"],
  usersRoot: ["admin", "users"],
  users: ({ q = "", page = 1, limit = 10 } = {}) => [
    "admin",
    "users",
    { q, page, limit },
  ],
  ordersRoot: ["admin", "orders"],
  orders: ({ status = "", page = 1, limit = 10 } = {}) => [
    "admin",
    "orders",
    { status, page, limit },
  ],
};
