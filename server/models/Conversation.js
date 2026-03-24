const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    messages: [
      {
        role: {
          type: String,
          required: true,
          enum: ["user", "assistant"],
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries — sorted by updatedAt desc for restore/fallback
conversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
