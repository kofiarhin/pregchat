const mongoose = require("mongoose");

const dailyContentSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      unique: true,
      min: 0,
      max: 280,
    },
    babyUpdate: {
      type: String,
      required: true,
      trim: true,
    },
    momUpdate: {
      type: String,
      required: true,
      trim: true,
    },
    tips: {
      type: String,
      required: true,
      trim: true,
    },
    assets: [
      {
        type: String,
        trim: true,
      },
    ],
    references: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DailyContent", dailyContentSchema);
