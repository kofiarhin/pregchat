const mongoose = require("mongoose");

const nameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    gender: {
      type: String,
      trim: true,
    },
    style: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

module.exports = mongoose.model("Name", nameSchema);
