const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const updatesRoutes = require("./routes/updatesRoutes");
const onboardingRoutes = require("./routes/onboarding.routes");
const messagesRoutes = require("./routes/messages");
const storeRoutes = require("./routes/store");
const midwifeRoutes = require("./routes/midwives");
const appointmentRoutes = require("./routes/appointments");
const journalRoutes = require("./routes/journals");
const namesRoutes = require("./routes/namesRoutes");
const errorHandler = require("./middleware/error");
const { createCorsOptions } = require("./config/cors");

const createApp = (configureApp) => {
  const app = express();

  const corsOptions = createCorsOptions();
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

  ap.get("/", async (req, res, next) => {
    return res.json({ message: "hello world" });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  app.use("/auth", authRoutes);
  app.use("/chat", chatRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/updates", updatesRoutes);
  app.use("/api/onboarding", onboardingRoutes);
  app.use("/api/messages", messagesRoutes);
  app.use("/api/store", storeRoutes);
  app.use("/api/midwives", midwifeRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/journals", journalRoutes);
  app.use("/api/names", namesRoutes);

  if (typeof configureApp === "function") {
    configureApp(app);
  }

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
