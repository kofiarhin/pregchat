const jwt = require("jsonwebtoken");

const ensureSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
};

const createToken = (payload, options = {}) => {
  ensureSecret();
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
    ...options,
  });
};

const verifyToken = (token) => {
  ensureSecret();
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  createToken,
  verifyToken,
};
