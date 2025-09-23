const mongoose = require("mongoose");
const Journal = require("../models/Journal");

const normalizeId = (value) => {
  if (!value) {
    return "";
  }

  try {
    return String(value);
  } catch (error) {
    return "";
  }
};

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const getJournals = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const journals = await Journal.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return res.json(journals);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Failed to fetch journals" });
  }
};

const getJournalById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!isValidObjectId(id)) {
      return res.status(404).json({ error: "Journal not found" });
    }

    const journal = await Journal.findById(id);

    if (!journal) {
      return res.status(404).json({ error: "Journal not found" });
    }

    if (normalizeId(journal.userId) !== normalizeId(userId)) {
      return res.status(403).json({ error: "Not authorised to view this journal" });
    }

    return res.json(journal);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Failed to fetch journal" });
  }
};

const createJournal = async (req, res) => {
  try {
    const { userId, title, content, date } = req.body;

    if (!userId || !title || !content) {
      return res
        .status(400)
        .json({ error: "User ID, title, and content are required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const payload = {
      userId,
      title: title.trim(),
      content: content.trim(),
    };

    if (date) {
      const parsedDate = new Date(date);
      if (!Number.isNaN(parsedDate.getTime())) {
        payload.date = parsedDate;
      }
    }

    const journal = await Journal.create(payload);

    return res.status(201).json(journal);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Failed to create journal" });
  }
};

const updateJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, title, content } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!isValidObjectId(id)) {
      return res.status(404).json({ error: "Journal not found" });
    }

    const journal = await Journal.findById(id);

    if (!journal) {
      return res.status(404).json({ error: "Journal not found" });
    }

    if (normalizeId(journal.userId) !== normalizeId(userId)) {
      return res.status(403).json({ error: "Not authorised to update this journal" });
    }

    if (title !== undefined) {
      journal.title = title.trim();
    }

    if (content !== undefined) {
      journal.content = content.trim();
    }

    await journal.save();

    return res.json(journal);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Failed to update journal" });
  }
};

const deleteJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!isValidObjectId(id)) {
      return res.status(404).json({ error: "Journal not found" });
    }

    const journal = await Journal.findById(id);

    if (!journal) {
      return res.status(404).json({ error: "Journal not found" });
    }

    if (normalizeId(journal.userId) !== normalizeId(userId)) {
      return res.status(403).json({ error: "Not authorised to delete this journal" });
    }

    await journal.deleteOne();

    return res.status(204).send();
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Failed to delete journal" });
  }
};

module.exports = {
  getJournals,
  getJournalById,
  createJournal,
  updateJournal,
  deleteJournal,
};
