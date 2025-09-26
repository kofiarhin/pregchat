const express = require("express");
const { deleteMessagesForUser } = require("../controllers/messageController");
const auth = require("../middleware/auth");

const router = express.Router();

router.delete("/:userId", auth, deleteMessagesForUser);

module.exports = router;
