const express = require("express");
const cors = require("cors");
const createConfiguredApp = require("./index");
const connectDB = require("./config/db");

const app = createConfiguredApp();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use("/api", require("./routes/profile.routes"));

module.exports = app;

if (require.main === module) {
  const start = async () => {
    try {
      await connectDB();
      const port = process.env.PORT || 5000;
      app.listen(port, () => console.log("API ready"));
    } catch (error) {
      console.error("Failed to start server", error);
      process.exit(1);
    }
  };

  start();
}
