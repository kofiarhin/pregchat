const path = require("path");
const express = require("express");

const createApp = require("./app");
const babyImageRoutes = require("./routes/babyImageRoutes");

const STATIC_ROOT = path.join(__dirname, "storage");

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
  });

module.exports = createConfiguredApp;
