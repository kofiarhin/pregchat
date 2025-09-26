require("dotenv").config();

const { createConfiguredApp, startServer } = require("./index");

const app = createConfiguredApp();

const { requireAuth } = require("./middleware/auth");
const requireAdmin = require("./middleware/requireAdmin");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/admin", requireAuth, requireAdmin, adminRoutes);

module.exports = app;

if (require.main === module) {
  startServer(app).catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
}
