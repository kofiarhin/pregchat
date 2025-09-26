const request = require("supertest");
const createApp = require("../../app");
const UserDetails = require("../../models/UserDetails");

process.env.SKIP_INTEGRATION_TESTS =
  process.env.SKIP_INTEGRATION_TESTS || "true";
const shouldSkip = () => process.env.SKIP_INTEGRATION_TESTS === "true";

let app;

beforeAll(() => {
  app = createApp();
});

const registerAndLogin = async () => {
  const unique = `${Date.now()}-${Math.random()}`;
  const registration = await request(app).post("/auth/register").send({
    name: "Onboarding User",
    email: `onboarding-${unique}@example.com`,
    password: "Password123!",
    region: "US",
  });

  const token = registration.body.token;

  return { token, user: registration.body.user };
};

describe("Onboarding controller", () => {
  it("returns 404 when no onboarding details exist", async () => {
    if (shouldSkip()) {
      return;
    }
    const { token } = await registerAndLogin();

    const response = await request(app)
      .get("/api/onboarding/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Onboarding details not found for this user.");
  });

  it("creates and retrieves onboarding details", async () => {
    if (shouldSkip()) {
      return;
    }
    const { token, user } = await registerAndLogin();

    const payload = {
      dueDateOrPregnancyWeek: "15 weeks",
      babyGender: "female",
      healthConsiderations: "None",
      updateFrequency: "daily",
      isFirstPregnancy: true,
    };

    const upsertResponse = await request(app)
      .post("/api/onboarding/me")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(upsertResponse.status).toBe(200);
    expect(upsertResponse.body.dueDateOrPregnancyWeek).toBe("15 weeks");
    expect(upsertResponse.body.updateFrequency).toBe("daily");

    const stored = await UserDetails.findOne({ user: user.id });
    expect(stored).toBeTruthy();
    expect(stored.isFirstPregnancy).toBe(true);

    const fetchResponse = await request(app)
      .get("/api/onboarding/me")
      .set("Authorization", `Bearer ${token}`);

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.babyGender).toBe("female");
  });

  it("updates existing onboarding details", async () => {
    if (shouldSkip()) {
      return;
    }
    const { token } = await registerAndLogin();

    await request(app)
      .post("/api/onboarding/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        dueDateOrPregnancyWeek: "2025-01-01",
        babyGender: null,
        healthConsiderations: "", 
        updateFrequency: "few_times_week",
        isFirstPregnancy: false,
      });

    const updateResponse = await request(app)
      .post("/api/onboarding/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        dueDateOrPregnancyWeek: "2025-02-01",
        babyGender: "unknown",
        healthConsiderations: "Gestational diabetes",
        updateFrequency: "weekly",
        isFirstPregnancy: true,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.dueDateOrPregnancyWeek).toBe("2025-02-01");
    expect(updateResponse.body.healthConsiderations).toBe("Gestational diabetes");
  });

  it("returns validation errors for invalid payloads", async () => {
    if (shouldSkip()) {
      return;
    }
    const { token } = await registerAndLogin();

    const response = await request(app)
      .post("/api/onboarding/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        dueDateOrPregnancyWeek: "",
        babyGender: "surprise",
        updateFrequency: "never",
        isFirstPregnancy: "maybe",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("dueDateOrPregnancyWeek is required and must be a string.");
    expect(response.body.details).toContain(
      "babyGender must be one of female, male, unknown or null."
    );
  });
});
