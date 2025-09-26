const express = require("express");
const { streamTts } = require("../controllers/ttsController");

const router = express.Router();

router.post("/", streamTts);

module.exports = router;
