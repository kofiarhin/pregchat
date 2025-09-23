const express = require("express");
const {
  getStoreItems,
  getStoreItemById,
  createStoreItem,
} = require("../controllers/storeController");

const router = express.Router();

router.get("/", getStoreItems);
router.get("/:id", getStoreItemById);
router.post("/", createStoreItem);

module.exports = router;
