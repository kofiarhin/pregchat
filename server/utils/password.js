const bcrypt = require("bcryptjs");

const DEFAULT_SALT_ROUNDS = 10;

const hashPassword = async (plainPassword, saltRounds = DEFAULT_SALT_ROUNDS) => {
  if (typeof plainPassword !== "string" || !plainPassword) {
    throw new Error("A non-empty password string is required");
  }

  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(plainPassword, salt);
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  if (typeof hashedPassword !== "string" || !hashedPassword) {
    throw new Error("A hashed password is required for verification");
  }

  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  verifyPassword,
};
