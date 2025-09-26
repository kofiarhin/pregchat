const mongoose = require("mongoose");
const { hashPassword, verifyPassword } = require("../utils/password");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      default: "UK",
      enum: ["UK", "US", "Global"],
    },
    onboardingCompletedAt: {
      type: Date,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();

  try {
    this.passwordHash = await hashPassword(this.passwordHash);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return verifyPassword(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);
