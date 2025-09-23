const express = require("express");
const {
  getMidwives,
  getMidwifeById,
} = require("../controllers/midwifeController");

const router = express.Router();

router.get("/", getMidwives);
router.get("/:id", getMidwifeById);

module.exports = router;
