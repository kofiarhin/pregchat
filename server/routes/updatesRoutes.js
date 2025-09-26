const express = require("express");
const {
  getToday,
  getDay,
  getProfile,
  updateProfile,
  deleteProfile,
} = require("../controllers/updatesController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /updates/today
router.get("/today", requireAuth, getToday);

// GET /updates/profile
router.get("/profile", requireAuth, getProfile);

// PUT /updates/profile
router.put("/profile", requireAuth, updateProfile);

// DELETE /updates/profile
router.delete("/profile", requireAuth, deleteProfile);

// GET /updates/:day
router.get("/:day", requireAuth, getDay);

module.exports = router;
