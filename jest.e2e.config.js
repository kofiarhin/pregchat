module.exports = {
  testEnvironment: "node",
  testTimeout: 90000,
  testMatch: ["<rootDir>/tests/e2e/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/e2e/setup.js"],
};
