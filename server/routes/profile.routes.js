const express = require("express");
const router = express.Router();
const { updateProfile } = require("../controllers/profile.controller");

router.patch("/:id", updateProfile);

module.exports = router;
