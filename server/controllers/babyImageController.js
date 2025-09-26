const Pregnancy = require("../models/Pregnancy");
const getOrCreateDailyBabyImage = require("../services/getOrCreateDailyBabyImage");

const getTodayBabyImage = async (req, res) => {
  try {
    const pregnancy = await Pregnancy.findOne({ userId: req.user._id }).lean();

    if (!pregnancy) {
      return res.status(404).json({ error: "PROFILE_NOT_FOUND" });
    }

    const profile = {};

    if (pregnancy.dueDate) {
      profile.dueDate = pregnancy.dueDate;
    }

    if (typeof pregnancy.dayIndex === "number") {
      profile.weeks = Math.floor(pregnancy.dayIndex / 7);
      profile.days = pregnancy.dayIndex % 7;
    }

    const result = await getOrCreateDailyBabyImage({
      userId: String(req.user._id),
      profile,
    });

    return res.json({
      url: result.url,
      week: result.week,
      day: result.day,
      dateKey: result.dateKey,
      isCached: result.isCached,
    });
  } catch (error) {
    if (error.code === "GA_UNAVAILABLE") {
      return res.status(400).json({ error: "GESTATIONAL_AGE_UNAVAILABLE" });
    }

    if (error.code === "GA_OUT_OF_RANGE") {
      return res.status(400).json({ error: "GESTATIONAL_AGE_OUT_OF_RANGE" });
    }

    if (error.code === "BABY_IMAGE_GENERATION_FAILED") {
      return res.status(503).json({ error: "BABY_IMAGE_NOT_AVAILABLE" });
    }

    console.error("Failed to get baby preview", error);

    return res.status(500).json({ error: "FAILED_TO_GENERATE_BABY_IMAGE" });
  }
};

module.exports = {
  getTodayBabyImage,
};
