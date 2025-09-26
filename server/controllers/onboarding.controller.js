const UserDetails = require("../models/UserDetails");
const { validateOnboardingPayload } = require("../utils/onboarding");

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
    const { isValid, errors, value } = validateOnboardingPayload(req.body);

    if (!isValid) {
      return res.status(400).json({ error: errors[0], details: errors });
    }

    const detailsPayload = {
      user: req.user._id,
      ...value,
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
