const path = require("path");
const express = require("express");

const createApp = require("./app");
const connectDB = require("./config/db");
const babyImageRoutes = require("./routes/babyImageRoutes");
const profileRoutes = require("./routes/profile.routes");

const STATIC_ROOT = path.join(__dirname, "storage");
const DEFAULT_PORT = 5000;

const createConfiguredApp = () =>
  createApp((app) => {
    app.use(
      "/static",
      express.static(STATIC_ROOT, {
        index: false,
        maxAge: "1d",
        immutable: true,
      })
    );

    app.use("/api/baby-image", babyImageRoutes);
    app.use("/api/profile", profileRoutes);
  });

const startServer = async (appInstance) => {
  const app = appInstance || createConfiguredApp();
  const port = process.env.PORT || DEFAULT_PORT;

  await connectDB();
  app.listen(port, () => {
    console.log(`API ready on port ${port}`);
  });

  return app;
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
}

module.exports = { createConfiguredApp, startServer };
