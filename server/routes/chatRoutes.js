const express = require("express");
const { ask } = require("../controllers/chatController");
const auth = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiter: 20 requests per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    error: "Too many chat requests. Please wait a minute before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /chat/ask
router.post("/ask", auth, chatLimiter, ask);

module.exports = router;
