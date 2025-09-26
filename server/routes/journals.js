const express = require("express");
const {
  getJournals,
  getJournalById,
  createJournal,
  updateJournal,
  deleteJournal,
} = require("../controllers/journalController");

const router = express.Router();

router.get("/", getJournals);
router.get("/:id", getJournalById);
router.post("/", createJournal);
router.put("/:id", updateJournal);
router.delete("/:id", deleteJournal);

module.exports = router;
