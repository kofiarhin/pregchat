const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    weeks: {
      type: Number,
      min: 0,
      default: 0,
    },
    days: {
      type: Number,
      min: 0,
      default: 0,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    frequency: {
      type: String,
      enum: ["daily", "few_per_week", "weekly"],
      default: "daily",
    },
    health: {
      type: String,
      trim: true,
      default: "",
    },
    isFirstPregnancy: {
      type: Boolean,
      default: null,
    },
    sex: {
      type: String,
      enum: ["girl", "boy", "unknown"],
      default: "unknown",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
