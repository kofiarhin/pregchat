const express = require("express");
const {
  getToday,
  getDay,
  getProfile,
  updateProfile,
  deleteProfile,
} = require("../controllers/updatesController");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /updates/today
router.get("/today", auth, getToday);

// GET /updates/profile
router.get("/profile", auth, getProfile);

// PUT /updates/profile
router.put("/profile", auth, updateProfile);

// DELETE /updates/profile
router.delete("/profile", auth, deleteProfile);

// GET /updates/:day
router.get("/:day", auth, getDay);

module.exports = router;
