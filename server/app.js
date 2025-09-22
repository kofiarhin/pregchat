const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const updatesRoutes = require("./routes/updatesRoutes");
const adminRoutes = require("./routes/adminRoutes");
const onboardingRoutes = require("./routes/onboarding.routes");
const errorHandler = require("./middleware/error");

const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
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
