const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      trim: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
    midwifeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Midwife",
      required: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["booked", "cancelled"],
      default: "booked",
    },
  },
  {
    timestamps: true,
  }
);

AppointmentSchema.index({ midwifeId: 1, start: 1 }, { unique: true });

module.exports = mongoose.model("Appointment", AppointmentSchema);
