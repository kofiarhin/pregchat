const request = require("supertest");
const mongoose = require("mongoose");
const createApp = require("../../app");
const User = require("../../models/User");
const Conversation = require("../../models/Conversation");

process.env.SKIP_INTEGRATION_TESTS =
  process.env.SKIP_INTEGRATION_TESTS || "true";
const shouldSkip = () => process.env.SKIP_INTEGRATION_TESTS === "true";

let app;

beforeAll(() => {
  app = createApp();
});

const registerUser = async (overrides = {}) => {
  const unique = `${Date.now()}-${Math.random()}`;
  const payload = {
    name: "Test User",
    email: `chat-user-${unique}@example.com`,
    password: "Password123!",
    region: "UK",
    ...overrides,
  };

  const response = await request(app).post("/auth/register").send(payload);
  const user = await User.findOne({ email: payload.email.toLowerCase() });

  return { user, token: response.body.token };
};

const seedConversation = async ({ userId, messageCount = 5 }) => {
  const now = Date.now();
  const messages = Array.from({ length: messageCount }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: `Message ${index + 1}`,
    timestamp: new Date(now + index * 1000),
  }));

  return Conversation.create({ userId, messages });
};

describe("GET /chat/conversations/:conversationId/messages", () => {
  it("returns paginated messages for the authenticated user", async () => {
    if (shouldSkip()) {
      return;
    }
    const { user, token } = await registerUser();
    const conversation = await seedConversation({ userId: user._id, messageCount: 5 });

    const response = await request(app)
      .get(`/chat/conversations/${conversation._id.toString()}/messages`)
      .set("Authorization", `Bearer ${token}`)
      .query({ page: 0, limit: 2 });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(5);
    expect(response.body.hasMore).toBe(true);
    expect(Array.isArray(response.body.messages)).toBe(true);
    expect(response.body.messages).toHaveLength(2);
    expect(response.body.messages[0].content).toBe("Message 1");
    expect(response.body.chat.id.toString()).toBe(conversation._id.toString());
    expect(Array.isArray(response.body.allMessages)).toBe(true);
    expect(response.body.allMessages).toHaveLength(5);
  });

  it("returns 404 for a conversation that does not exist", async () => {
    if (shouldSkip()) {
      return;
    }
    const { token } = await registerUser();
    const missingId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/chat/conversations/${missingId}/messages`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Conversation not found");
  });
});
