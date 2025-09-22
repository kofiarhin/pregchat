const path = require("path");
const mongoose = require("mongoose");
const { chromium } = require("playwright");
const { MongoMemoryServer } = require("mongodb-memory-server");
const connectDB = require("../../server/config/db");
const createApp = require("../../server/app");
const User = require("../../server/models/User");
const UserDetails = require("../../server/models/UserDetails");

let mongoServer;
let httpServer;
let browser;
let viteServer;
let baseUrl;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = "e2e-secret";

  await connectDB();

  const app = createApp();
  await new Promise((resolve) => {
    httpServer = app.listen(5001, resolve);
  });

  const vite = await import("vite");
  process.env.VITE_API_BASE = "http://localhost:5001";
  viteServer = await vite.createServer({
    root: path.resolve(__dirname, "../../client"),
    server: {
      port: 5173,
      strictPort: true,
    },
    logLevel: "error",
  });
  await viteServer.listen();
  baseUrl = `http://localhost:${viteServer.config.server.port}`;

  browser = await chromium.launch();
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }

  if (viteServer) {
    await viteServer.close();
  }

  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }

  await mongoose.connection.close();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("PregChat end-to-end auth and onboarding", () => {
  it("completes the full user flow with validation checks", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });

    // Login failure path
    await page.fill('input[name="email"]', "missing@example.com");
    await page.fill('input[name="password"]', "WrongPassword1!");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/auth/login") && response.status() === 401
      ),
      page.click('button:has-text("Login")'),
    ]);
    await page.waitForSelector('text=Invalid credentials');

    // Register new account
    await page.click('text=Register');
    await page.waitForURL(`${baseUrl}/register`);

    const unique = `${Date.now()}-${Math.random()}`;
    const email = `e2e-${unique}@example.com`;

    await page.fill('#name', 'E2E User');
    await page.fill('#email', email);
    await page.fill('#password', 'Password123!');
    await page.selectOption('#region', 'UK');

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/auth/register") && response.status() === 201
      ),
      page.click('button:has-text("Register")'),
    ]);

    await page.waitForURL(`${baseUrl}/chat`, { waitUntil: "networkidle" });
    await page.waitForResponse(
      (response) => response.url().endsWith("/auth/me") && response.status() === 200
    );

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    const userRecord = await User.findOne({ email });
    expect(userRecord).toBeTruthy();

    // Navigate to onboarding and trigger validation errors
    await page.goto(`${baseUrl}/onboarding`, { waitUntil: "networkidle" });
    await page.waitForSelector('form.onboarding_form');

    await Promise.all([
      page.waitForTimeout(50),
      page.click('button:has-text("Save and continue")'),
    ]);
    await page.waitForSelector('text=This field is required.');
    await page.waitForSelector("text=Select how often you'd like updates.");

    // Submit valid onboarding details
    await page.fill('#dueDateOrPregnancyWeek', '18 weeks');
    await page.selectOption('#updateFrequency', 'daily');
    await page.selectOption('#babyGender', 'female');
    await page.fill('#healthConsiderations', 'Prenatal vitamins');
    await page.check('#firstPregnancyYes');

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/onboarding/me') &&
          response.request().method() === 'POST' &&
          response.status() === 200
      ),
      page.click('button:has-text("Save and continue")'),
    ]);

    await page.waitForURL(`${baseUrl}/welcome`, { waitUntil: "networkidle" });

    const storedDetails = await UserDetails.findOne({ user: userRecord._id }).lean();
    expect(storedDetails.dueDateOrPregnancyWeek).toBe('18 weeks');
    expect(storedDetails.updateFrequency).toBe('daily');
    expect(storedDetails.isFirstPregnancy).toBe(true);

    // Update onboarding details
    await page.goto(`${baseUrl}/onboarding`, { waitUntil: "networkidle" });
    await page.waitForSelector('#dueDateOrPregnancyWeek');

    const prefilled = await page.inputValue('#dueDateOrPregnancyWeek');
    expect(prefilled).toBe('18 weeks');

    await page.fill('#dueDateOrPregnancyWeek', '20 weeks');
    await page.selectOption('#updateFrequency', 'weekly');
    await page.selectOption('#babyGender', 'unknown');
    await page.fill('#healthConsiderations', 'Iron supplements');
    await page.check('#firstPregnancyNo');

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/onboarding/me') &&
          response.request().method() === 'POST' &&
          response.status() === 200
      ),
      page.click('button:has-text("Save and continue")'),
    ]);

    await page.waitForURL(`${baseUrl}/welcome`, { waitUntil: "networkidle" });

    const updatedDetails = await UserDetails.findOne({ user: userRecord._id }).lean();
    expect(updatedDetails.dueDateOrPregnancyWeek).toBe('20 weeks');
    expect(updatedDetails.updateFrequency).toBe('weekly');
    expect(updatedDetails.isFirstPregnancy).toBe(false);
    expect(updatedDetails.babyGender).toBe('unknown');

    // Logout and confirm auth/me fails without token
    await page.goto(`${baseUrl}/chat`, { waitUntil: "networkidle" });
    await page.click('button[aria-label="Open menu"]');
    await page.click('button.logout_btn');
    await page.waitForURL(`${baseUrl}/login`);

    const meStatus = await page.evaluate(async () => {
      const response = await fetch('http://localhost:5001/auth/me');
      return response.status;
    });
    expect(meStatus).toBe(401);

    await context.close();
  });
});
