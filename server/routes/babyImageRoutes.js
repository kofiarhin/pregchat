const express = require("express");

const { getTodayBabyImage } = require("../controllers/babyImageController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/today", auth, getTodayBabyImage);

module.exports = router;
