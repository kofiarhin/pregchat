const express = require("express");
const { upsertContent } = require("../controllers/adminController");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /admin/content
router.post("/content", auth, upsertContent);

module.exports = router;
