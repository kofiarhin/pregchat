const express = require("express");
const {
  ask,
  getConversations,
  getConversationMessages,
  createConversation,
  updateConversation,
  deleteConversation,
} = require("../controllers/chatController");
const { requireAuth } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiter: 20 requests per minute per IP — AI calls only
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    error: "Too many chat requests. Please wait a minute before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Conversation management (no rate limiter — no AI calls) ──────────────────
router.get("/conversations", requireAuth, getConversations);
router.post("/conversations", requireAuth, createConversation);
router.patch("/conversations/:conversationId", requireAuth, updateConversation);
router.delete("/conversations/:conversationId", requireAuth, deleteConversation);

// ── Messages ─────────────────────────────────────────────────────────────────
router.get(
  "/conversations/:conversationId/messages",
  requireAuth,
  getConversationMessages
);

// ── AI chat (rate limited) ───────────────────────────────────────────────────
router.post("/", requireAuth, chatLimiter, ask);
router.post("/ask", requireAuth, chatLimiter, ask);

module.exports = router;
