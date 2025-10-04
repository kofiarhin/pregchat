const mongoose = require("mongoose");

const AvailabilitySchema = new mongoose.Schema(
  {
    weekday: {
      type: Number,
      min: 0,
      max: 6,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const MidwifeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    specialties: {
      type: [String],
      default: [],
    },
    photo: {
      type: String,
      trim: true,
    },
    availability: {
      type: [AvailabilitySchema],
      default: [],
    },
    appointmentDurationMin: {
      type: Number,
      default: 30,
      min: 5,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Midwife", MidwifeSchema);
