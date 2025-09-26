const express = require("express");
const {
  listUsers,
  listOrders,
  updateOrderStatus,
} = require("../controllers/adminManagementController");

const router = express.Router();

router.get("/users", listUsers);
router.get("/orders", listOrders);
router.patch("/orders/:id/status", updateOrderStatus);

module.exports = router;
