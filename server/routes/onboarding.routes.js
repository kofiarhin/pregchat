const express = require("express");
const router = express.Router();
const {
  getMyDetails,
  upsertMyDetails,
} = require("../controllers/onboarding.controller");
const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);
router.get("/me", getMyDetails);
router.post("/me", upsertMyDetails);

module.exports = router;
