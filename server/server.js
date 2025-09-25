require("dotenv").config();

const { createConfiguredApp, startServer } = require("./index");

const app = createConfiguredApp();

module.exports = app;

if (require.main === module) {
  startServer(app).catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
}
