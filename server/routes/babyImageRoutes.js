const express = require("express");

const { getTodayBabyImage } = require("../controllers/babyImageController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/today", requireAuth, getTodayBabyImage);

module.exports = router;
