const Pregnancy = require("../models/Pregnancy");
const DailyContent = require("../models/DailyContent");

const formatPregnancy = (document) => {
  if (!document) {
    return null;
  }

  return {
    lmpDate: document.lmpDate,
    dueDate: document.dueDate,
    dayIndex: document.dayIndex,
    updatedAt: document.updatedAt,
  };
};

const getToday = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's pregnancy profile
    const pregnancy = await Pregnancy.findOne({ userId });
    if (!pregnancy) {
      return res
        .status(404)
        .json({
          error:
            "Pregnancy profile not found. Please set up your profile first.",
        });
    }

    // Calculate current day index
    const dayIndex = pregnancy.calculateDayIndex();

    // Get daily content for this day
    const dailyContent = await DailyContent.findOne({ day: dayIndex });
    if (!dailyContent) {
      return res
        .status(404)
        .json({
          error:
            "Daily content not found for this day. Please run the seed script.",
        });
    }

    res.json({
      day: dayIndex,
      babyUpdate: dailyContent.babyUpdate,
      momUpdate: dailyContent.momUpdate,
      tips: dailyContent.tips,
      assets: dailyContent.assets,
      references: dailyContent.references,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDay = async (req, res) => {
  try {
    const { day } = req.params;
    const dayIndex = parseInt(day);

    if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 280) {
      return res
        .status(400)
        .json({ error: "Invalid day. Must be between 0 and 280." });
    }

    const dailyContent = await DailyContent.findOne({ day: dayIndex });
    if (!dailyContent) {
      return res
        .status(404)
        .json({ error: "Daily content not found for this day." });
    }

    res.json({
      day: dayIndex,
      babyUpdate: dailyContent.babyUpdate,
      momUpdate: dailyContent.momUpdate,
      tips: dailyContent.tips,
      assets: dailyContent.assets,
      references: dailyContent.references,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const pregnancy = await Pregnancy.findOne({
      userId: req.user._id,
    })
      .select("lmpDate dueDate dayIndex updatedAt")
      .lean();

    if (!pregnancy) {
      return res
        .status(404)
        .json({ error: "Pregnancy profile not found for this user." });
    }

    return res.json(formatPregnancy(pregnancy));
  } catch (error) {
    return res.status(500).json({ error: "Failed to load pregnancy profile." });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { lmpDate, dueDate } = req.body;

    if (!lmpDate && !dueDate) {
      return res
        .status(400)
        .json({ error: "Either LMP date or due date is required." });
    }

    let pregnancyData = {};

    if (lmpDate) {
      const lmp = new Date(lmpDate);
      if (isNaN(lmp.getTime())) {
        return res.status(400).json({ error: "Invalid LMP date format." });
      }
      pregnancyData.lmpDate = lmp;
      pregnancyData.dueDate = new Date(
        lmp.getTime() + 280 * 24 * 60 * 60 * 1000
      ); // 280 days
    } else if (dueDate) {
      const due = new Date(dueDate);
      if (isNaN(due.getTime())) {
        return res.status(400).json({ error: "Invalid due date format." });
      }
      pregnancyData.dueDate = due;
      pregnancyData.lmpDate = new Date(
        due.getTime() - 280 * 24 * 60 * 60 * 1000
      ); // 280 days before
    }

    // Calculate day index
    const pregnancy = new Pregnancy({
      userId,
      ...pregnancyData,
    });
    pregnancyData.dayIndex = pregnancy.calculateDayIndex();

    // Update or create pregnancy profile
    const updatedPregnancy = await Pregnancy.findOneAndUpdate(
      { userId },
      {
        ...pregnancyData,
        userId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!req.user.onboardingCompletedAt) {
      req.user.onboardingCompletedAt = new Date();
      await req.user.save();
    }

    res.json(formatPregnancy(updatedPregnancy));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const deleted = await Pregnancy.findOneAndDelete({ userId: req.user._id });

    if (!deleted) {
      return res
        .status(404)
        .json({ error: "Pregnancy profile not found for this user." });
    }

    if (req.user.onboardingCompletedAt) {
      req.user.onboardingCompletedAt = null;
      await req.user.save();
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to reset pregnancy profile." });
  }
};

module.exports = {
  getToday,
  getDay,
  getProfile,
  updateProfile,
  deleteProfile,
};
