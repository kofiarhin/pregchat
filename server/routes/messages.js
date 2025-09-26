const express = require("express");
const { deleteMessagesForUser } = require("../controllers/messageController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.delete("/:userId", requireAuth, deleteMessagesForUser);

module.exports = router;
