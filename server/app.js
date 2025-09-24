const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const updatesRoutes = require("./routes/updatesRoutes");
const adminRoutes = require("./routes/adminRoutes");
const onboardingRoutes = require("./routes/onboarding.routes");
const messagesRoutes = require("./routes/messages");
const storeRoutes = require("./routes/store");
const midwifeRoutes = require("./routes/midwives");
const appointmentRoutes = require("./routes/appointments");
const journalRoutes = require("./routes/journals");
const errorHandler = require("./middleware/error");

const normalizeOrigins = (value) =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const defaultAllowedOrigins = [
  "http://localhost:5000",
  "http://localhost:5173",
  "https://pregchat-mu.vercel.app/",
];

const envAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? normalizeOrigins(process.env.CORS_ALLOWED_ORIGINS)
  : [];

const allowedOrigins = Array.from(
  new Set([...envAllowedOrigins, ...defaultAllowedOrigins])
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

const createApp = (configureApp) => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    keyGenerator: (req) => req.ip,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  app.use("/auth", authRoutes);
  app.use("/chat", chatRoutes);
  app.use("/updates", updatesRoutes);
  app.use("/admin", adminRoutes);
  app.use("/api/onboarding", onboardingRoutes);
  app.use("/api/messages", messagesRoutes);
  app.use("/api/store", storeRoutes);
  app.use("/api/midwives", midwifeRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/journals", journalRoutes);

  if (typeof configureApp === "function") {
    configureApp(app);
  }

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
