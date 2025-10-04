const Conversation = require("../models/Conversation");

const deleteMessagesForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (String(req.user?._id) !== String(userId)) {
      return res.status(403).json({ error: "Not authorised to clear this chat" });
    }

    await Conversation.updateOne({ userId }, { $set: { messages: [] } });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to clear messages" });
  }
};

module.exports = { deleteMessagesForUser };
