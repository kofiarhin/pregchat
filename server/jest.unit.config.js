module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/unit.setup.js"],
  clearMocks: true,
  collectCoverage: false,
};
