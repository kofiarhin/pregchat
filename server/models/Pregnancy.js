const mongoose = require("mongoose");

const pregnancySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    lmpDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    dayIndex: {
      type: Number,
      min: 0,
      max: 280,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate dayIndex from LMP date
pregnancySchema.methods.calculateDayIndex = function () {
  const today = new Date();
  const diffTime = today - this.lmpDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(280, diffDays));
};

// Calculate due date from LMP (40 weeks = 280 days)
pregnancySchema.methods.calculateDueDate = function () {
  const dueDate = new Date(this.lmpDate);
  dueDate.setDate(dueDate.getDate() + 280);
  return dueDate;
};

module.exports = mongoose.model("Pregnancy", pregnancySchema);
