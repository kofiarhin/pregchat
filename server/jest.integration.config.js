module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/integration.setup.js"],
  clearMocks: true,
  testTimeout: 30000,
};
