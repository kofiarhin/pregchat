const express = require("express");
const {
  getStoreItems,
  getStoreItemById,
  createStoreItem,
} = require("../controllers/storeController");
const { requireAuth } = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/", getStoreItems);
router.get("/:id", getStoreItemById);
router.post("/", requireAuth, requireAdmin, createStoreItem);

module.exports = router;
