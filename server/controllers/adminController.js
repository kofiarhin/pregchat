const DailyContent = require("../models/DailyContent");

const upsertContent = async (req, res) => {
  try {
    const contentArray = req.body;

    if (!Array.isArray(contentArray)) {
      return res
        .status(400)
        .json({ error: "Content must be an array of daily content objects." });
    }

    const results = [];
    const errors = [];

    for (const content of contentArray) {
      try {
        const { day, babyUpdate, momUpdate, tips, assets, references } =
          content;

        if (typeof day !== "number" || day < 0 || day > 280) {
          errors.push(`Invalid day ${day}. Must be between 0 and 280.`);
          continue;
        }

        if (!babyUpdate || !momUpdate || !tips) {
          errors.push(`Missing required fields for day ${day}.`);
          continue;
        }

        const updatedContent = await DailyContent.findOneAndUpdate(
          { day },
          {
            babyUpdate,
            momUpdate,
            tips,
            assets: assets || [],
            references: references || [],
          },
          { upsert: true, new: true }
        );

        results.push({
          day,
          success: true,
          content: updatedContent,
        });
      } catch (error) {
        errors.push(`Error processing day ${content.day}: ${error.message}`);
      }
    }

    res.json({
      success: errors.length === 0,
      processed: results.length,
      errors: errors.length,
      results,
      errorDetails: errors,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  upsertContent,
};
