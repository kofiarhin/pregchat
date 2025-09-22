const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const updatesRoutes = require("./routes/updatesRoutes");
const adminRoutes = require("./routes/adminRoutes");
const onboardingRoutes = require("./routes/onboarding.routes");
const errorHandler = require("./middleware/error");

const createApp = () => {
  const app = express();

  app.set("trust proxy", 1);

  const limiter = rateLimit({
    keyGenerator: (req) => req.ip,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  app.use(
    cors({
      origin: "*",
      methods: "GET,POST,PUT,DELETE,OPTIONS",
      allowedHeaders: "Content-Type,Authorization",
      credentials: true,
    })
  );

  app.options("*", cors());
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

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
