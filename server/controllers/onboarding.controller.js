const UserDetails = require("../models/UserDetails");

const allowedGenders = [null, "female", "male", "unknown"];
const allowedFrequencies = ["daily", "few_times_week", "weekly"];

const formatDetails = (details) => {
  if (!details) {
    return null;
  }

  const {
    _id,
    user,
    dueDateOrPregnancyWeek,
    babyGender,
    healthConsiderations,
    updateFrequency,
    isFirstPregnancy,
    createdAt,
    updatedAt,
  } = details;

  return {
    _id,
    user,
    dueDateOrPregnancyWeek,
    babyGender,
    healthConsiderations,
    updateFrequency,
    isFirstPregnancy,
    createdAt,
    updatedAt,
  };
};

const getMyDetails = async (req, res) => {
  try {
    const details = await UserDetails.findOne({ user: req.user._id }).lean();

    if (!details) {
      return res
        .status(404)
        .json({ error: "Onboarding details not found for this user." });
    }

    return res.json(formatDetails(details));
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch onboarding details." });
  }
};

const upsertMyDetails = async (req, res) => {
  try {
    const {
      dueDateOrPregnancyWeek,
      babyGender = null,
      healthConsiderations = "",
      updateFrequency,
      isFirstPregnancy,
    } = req.body;

    if (typeof dueDateOrPregnancyWeek !== "string" || !dueDateOrPregnancyWeek.trim()) {
      return res
        .status(400)
        .json({ error: "dueDateOrPregnancyWeek is required and must be a string." });
    }

    const normalizedGender =
      babyGender === null || babyGender === ""
        ? null
        : String(babyGender).toLowerCase();

    if (!allowedGenders.includes(normalizedGender)) {
      return res
        .status(400)
        .json({ error: "babyGender must be one of female, male, unknown or null." });
    }

    if (!allowedFrequencies.includes(updateFrequency)) {
      return res.status(400).json({ error: "updateFrequency is invalid." });
    }

    let normalizedIsFirstPregnancy = isFirstPregnancy;
    if (typeof normalizedIsFirstPregnancy === "string") {
      if (normalizedIsFirstPregnancy === "true") {
        normalizedIsFirstPregnancy = true;
      } else if (normalizedIsFirstPregnancy === "false") {
        normalizedIsFirstPregnancy = false;
      }
    }

    if (typeof normalizedIsFirstPregnancy !== "boolean") {
      return res
        .status(400)
        .json({ error: "isFirstPregnancy must be a boolean value." });
    }

    const detailsPayload = {
      user: req.user._id,
      dueDateOrPregnancyWeek: dueDateOrPregnancyWeek.trim(),
      babyGender: normalizedGender,
      healthConsiderations:
        typeof healthConsiderations === "string"
          ? healthConsiderations.trim()
          : "",
      updateFrequency,
      isFirstPregnancy: normalizedIsFirstPregnancy,
    };

    const details = await UserDetails.findOneAndUpdate(
      { user: req.user._id },
      detailsPayload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    if (!req.user.onboardingCompletedAt) {
      req.user.onboardingCompletedAt = new Date();
      await req.user.save();
    }

    return res.json(formatDetails(details));
  } catch (error) {
    return res.status(500).json({ error: "Failed to save onboarding details." });
  }
};

module.exports = {
  getMyDetails,
  upsertMyDetails,
};
