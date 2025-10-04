const request = require("supertest");
const createApp = require("../../app");
const User = require("../../models/User");

jest.mock("../../config/ai", () => ({
  askAya: jest.fn(),
  triageCheck: jest.fn(),
}));

const { askAya, triageCheck } = require("../../config/ai");

process.env.SKIP_INTEGRATION_TESTS =
  process.env.SKIP_INTEGRATION_TESTS || "true";
const shouldSkip = () => process.env.SKIP_INTEGRATION_TESTS === "true";

let app;

beforeAll(() => {
  app = createApp();
});

beforeEach(() => {
  askAya.mockReset();
  triageCheck.mockReset();
});

const registerUser = async (overrides = {}) => {
  const unique = `${Date.now()}-${Math.random()}`;
  const payload = {
    name: "Test User",
    email: `ask-user-${unique}@example.com`,
    password: "Password123!",
    region: "UK",
    ...overrides,
  };

  const response = await request(app).post("/auth/register").send(payload);
  const user = await User.findOne({ email: payload.email.toLowerCase() });

  return { user, token: response.body.token };
};

describe("POST /chat/ask", () => {
  it("accepts a text payload and forwards it to askAya", async () => {
    if (shouldSkip()) {
      return;
    }

    const { token } = await registerUser();
    triageCheck.mockReturnValue(false);
    askAya.mockResolvedValue({ content: "Mock response" });

    const response = await request(app)
      .post("/chat/ask")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "  Hello there  " });

    expect(response.status).toBe(200);
    expect(response.body.content).toBe("Mock response");
    expect(triageCheck).toHaveBeenCalledWith("Hello there");
    expect(askAya).toHaveBeenCalledWith({
      text: "Hello there",
      region: "UK",
      dayData: null,
      stream: false,
    });
  });

  it("returns 400 when no message text is provided", async () => {
    if (shouldSkip()) {
      return;
    }

    const { token } = await registerUser();

    const response = await request(app)
      .post("/chat/ask")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "   " });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Message text is required");
    expect(triageCheck).not.toHaveBeenCalled();
    expect(askAya).not.toHaveBeenCalled();
  });
});
