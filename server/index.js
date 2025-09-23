const path = require("path");
const express = require("express");

const createApp = require("./app");
const babyImageRoutes = require("./routes/babyImageRoutes");

const createConfiguredApp = () =>
  createApp((app) => {
    app.use(
      "/static",
      express.static(path.join(__dirname, "storage"), {
        maxAge: "1d",
        immutable: true,
      })
    );

    app.use("/api/baby-image", babyImageRoutes);
  });

module.exports = createConfiguredApp;
