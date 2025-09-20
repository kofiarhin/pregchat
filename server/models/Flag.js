const mongoose = require("mongoose");

const flagSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ["red_flag", "urgent", "medical_concern"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
flagSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Flag", flagSchema);
