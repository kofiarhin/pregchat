require("dotenv").config();

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "https://pregchat-mu.vercel.app",
  "http://localhost:4000",
  "https://pregchat-tan.vercel.app",
];

const parseAllowedOrigins = () => {
  const { ALLOWED_ORIGINS } = process.env;

  if (!ALLOWED_ORIGINS) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const createCorsOptions = () => {
  const allowedOrigins = parseAllowedOrigins();

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  };
};

module.exports = { createCorsOptions };
