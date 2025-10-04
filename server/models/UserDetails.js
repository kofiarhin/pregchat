const mongoose = require("mongoose");
const { Schema } = mongoose;

const userDetailsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    dueDateOrPregnancyWeek: {
      type: String,
      required: true,
      trim: true,
    },
    babyGender: {
      type: String,
      default: null,
      enum: [null, "female", "male", "unknown"],
    },
    healthConsiderations: {
      type: String,
      default: "",
    },
    updateFrequency: {
      type: String,
      required: true,
      enum: ["daily", "few_times_week", "weekly"],
    },
    isFirstPregnancy: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserDetails", userDetailsSchema);
