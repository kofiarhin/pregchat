const mongoose = require("mongoose");
const User = require("../models/User");
const OrderModel = require("../models/Order");
const { ORDER_STATUSES } = OrderModel;
const Order = OrderModel;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};

const escapeRegExp = (value = "") => String(value).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");

const normalizeUserRole = (user) => {
  if (!user) {
    return "user";
  }

  if (user.role) {
    return user.role;
  }

  return user.isAdmin === true ? "admin" : "user";
};

const formatUser = (user) => ({
  id: user._id?.toString(),
  name: user.name ?? "",
  email: user.email ?? "",
  role: normalizeUserRole(user),
  isAdmin: user.isAdmin === true,
  createdAt: user.createdAt,
});

const formatOrder = (order) => {
  if (!order) {
    return null;
  }

  const customer = order.customer || {};

  return {
    id: order._id?.toString(),
    customer: {
      id: customer?._id ? customer._id.toString() : undefined,
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      role: normalizeUserRole(customer),
      isAdmin: customer?.isAdmin === true,
    },
    total: order.total ?? 0,
    status: order.status,
    notes: order.notes ?? "",
    items: Array.isArray(order.items) ? order.items : [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

const buildPagination = ({ total, page, limit }) => {
  const totalPages = limit > 0 ? Math.ceil(total / limit) || 1 : 1;
  return {
    page,
    limit,
    totalItems: total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

const listUsers = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query?.page, DEFAULT_PAGE);
    const limit = parsePositiveInt(req.query?.limit, DEFAULT_LIMIT);
    const safeLimit = Math.min(limit, MAX_LIMIT);
    const queryText = (req.query?.q ?? "").trim();

    const filters = {};

    if (queryText) {
      const regex = new RegExp(escapeRegExp(queryText), "i");
      filters.$or = [{ name: regex }, { email: regex }];
    }

    const skip = (page - 1) * safeLimit;

    const [total, users] = await Promise.all([
      User.countDocuments(filters),
      User.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .select("name email isAdmin role createdAt")
        .lean(),
    ]);

    const data = users.map(formatUser);
    const pagination = buildPagination({ total, page, limit: safeLimit });

    return res.json({ data, pagination });
  } catch (error) {
    console.error("Admin listUsers error:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

const listOrders = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query?.page, DEFAULT_PAGE);
    const limit = parsePositiveInt(req.query?.limit, DEFAULT_LIMIT);
    const safeLimit = Math.min(limit, MAX_LIMIT);
    const statusFilter = (req.query?.status ?? "").trim().toLowerCase();

    const filters = {};
    if (statusFilter && ORDER_STATUSES.includes(statusFilter)) {
      filters.status = statusFilter;
    }

    const skip = (page - 1) * safeLimit;

    const [total, orders] = await Promise.all([
      Order.countDocuments(filters),
      Order.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate({
          path: "customer",
          select: "name email isAdmin role",
        })
        .lean(),
    ]);

    const data = orders.map(formatOrder);
    const pagination = buildPagination({ total, page, limit: safeLimit });

    return res.json({ data, pagination });
  } catch (error) {
    console.error("Admin listOrders error:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!status || !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const order = await Order.findById(id).populate({
      path: "customer",
      select: "name email isAdmin role",
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    if (notes !== undefined) {
      order.notes = notes;
    }

    await order.save();

    const formatted = formatOrder(order.toObject ? order.toObject() : order);

    return res.json({ order: formatted });
  } catch (error) {
    console.error("Admin updateOrderStatus error:", error);
    return res.status(500).json({ error: "Failed to update order" });
  }
};

module.exports = {
  listUsers,
  listOrders,
  updateOrderStatus,
};
