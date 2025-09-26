const express = require("express");
const {
  ask,
  getConversations,
  getConversationMessages,
} = require("../controllers/chatController");
const { requireAuth } = require("../middleware/auth");
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

// GET /chat/conversations
router.get("/conversations", requireAuth, getConversations);

// GET /chat/conversations/:conversationId/messages
router.get(
  "/conversations/:conversationId/messages",
  requireAuth,
  getConversationMessages
);

// POST /chat/ask
router.post("/ask", requireAuth, chatLimiter, ask);

module.exports = router;
