const express = require("express");
const {
  getToday,
  getDay,
  updateProfile,
} = require("../controllers/updatesController");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /updates/today
router.get("/today", auth, getToday);

// GET /updates/:day
router.get("/:day", auth, getDay);

// PUT /pregnancy/profile
router.put("/profile", auth, updateProfile);

module.exports = router;
