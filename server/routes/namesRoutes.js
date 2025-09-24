const express = require("express");
const { getNames } = require("../controllers/namesController");

const router = express.Router();

router.get("/", getNames);

module.exports = router;
