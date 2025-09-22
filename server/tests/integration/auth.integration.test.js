const request = require("supertest");
const createApp = require("../../app");
const User = require("../../models/User");

let app;

beforeAll(() => {
  app = createApp();
});

const registerUser = async (overrides = {}) => {
  const unique = `${Date.now()}-${Math.random()}`;
  const payload = {
    name: "Test User",
    email: `user-${unique}@example.com`,
    password: "Password123!",
    region: "UK",
    ...overrides,
  };

  const response = await request(app).post("/auth/register").send(payload);

  return { payload, response };
};

describe("Auth controller", () => {
  it("registers a new user", async () => {
    const { payload, response } = await registerUser();

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(payload.email.toLowerCase());

    const storedUser = await User.findOne({ email: payload.email.toLowerCase() });
    expect(storedUser).toBeTruthy();
    expect(storedUser.region).toBe("UK");
  });

  it("rejects duplicate registrations", async () => {
    const { payload } = await registerUser({ email: "duplicate@example.com" });

    const duplicate = await request(app).post("/auth/register").send(payload);

    expect(duplicate.status).toBe(400);
    expect(duplicate.body.error).toBe("Email already registered");
  });

  it("logs in with valid credentials", async () => {
    const { payload } = await registerUser();

    const response = await request(app)
      .post("/auth/login")
      .send({ email: payload.email, password: payload.password });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(payload.email.toLowerCase());
  });

  it("rejects invalid credentials", async () => {
    const { payload } = await registerUser();

    const response = await request(app)
      .post("/auth/login")
      .send({ email: payload.email, password: "wrong" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid credentials");
  });

  it("returns authenticated user with valid token", async () => {
    const { response } = await registerUser();
    const token = response.body.token;

    const meResponse = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe(response.body.user.email);
  });

  it("denies access to /auth/me without token", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied. No token provided.");
  });
});
