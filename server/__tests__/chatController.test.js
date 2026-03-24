const mongoose = require("mongoose");

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockConversationCreate = jest.fn();
const mockConversationFind = jest.fn();
const mockConversationFindOne = jest.fn();
const mockConversationFindOneAndUpdate = jest.fn();
const mockConversationFindOneAndDelete = jest.fn();
const mockConversationFindByIdAndUpdate = jest.fn();

jest.mock("../models/Conversation", () => ({
  create: (...args) => mockConversationCreate(...args),
  find: (...args) => mockConversationFind(...args),
  findOne: (...args) => mockConversationFindOne(...args),
  findOneAndUpdate: (...args) => mockConversationFindOneAndUpdate(...args),
  findOneAndDelete: (...args) => mockConversationFindOneAndDelete(...args),
  findByIdAndUpdate: (...args) => mockConversationFindByIdAndUpdate(...args),
}));

const mockFlagCreate = jest.fn();
jest.mock("../models/Flag", () => ({
  create: (...args) => mockFlagCreate(...args),
}));

jest.mock("../models/Pregnancy", () => ({
  findOne: jest.fn().mockResolvedValue(null),
}));

jest.mock("../models/DailyContent", () => ({
  findOne: jest.fn().mockResolvedValue(null),
}));

jest.mock("../config/ai", () => ({
  askAya: jest.fn().mockResolvedValue({ content: "Aya response" }),
  triageCheck: jest.fn().mockReturnValue(false),
}));

const { askAya, triageCheck } = require("../config/ai");

const {
  createConversation,
  updateConversation,
  deleteConversation,
  getConversations,
  getConversationMessages,
  ask,
} = require("../controllers/chatController");

// ── Helpers ───────────────────────────────────────────────────────────────────

const userId = new mongoose.Types.ObjectId().toString();
const convId = new mongoose.Types.ObjectId().toString();

const makeReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { _id: userId, region: "UK" },
  ...overrides,
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const fakeConv = (overrides = {}) => ({
  _id: convId,
  userId,
  title: "My thread",
  messages: [],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-02"),
  ...overrides,
});

// ── createConversation ────────────────────────────────────────────────────────

describe("createConversation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a conversation and returns 201 with formatted shape", async () => {
    const conv = fakeConv({ title: "new" });
    mockConversationCreate.mockResolvedValue(conv);

    const req = makeReq({ body: { title: "new" } });
    const res = makeRes();
    await createConversation(req, res);

    expect(mockConversationCreate).toHaveBeenCalledWith({
      userId,
      title: "new",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: convId, title: "new" })
    );
  });

  it("creates a conversation with empty title when none is provided", async () => {
    const conv = fakeConv({ title: "" });
    mockConversationCreate.mockResolvedValue(conv);

    const req = makeReq({ body: {} });
    const res = makeRes();
    await createConversation(req, res);

    expect(mockConversationCreate).toHaveBeenCalledWith({ userId, title: "" });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 400 when title exceeds 120 characters", async () => {
    const req = makeReq({ body: { title: "a".repeat(121) } });
    const res = makeRes();
    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockConversationCreate).not.toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    mockConversationCreate.mockRejectedValue(new Error("DB error"));
    const req = makeReq({ body: { title: "test" } });
    const res = makeRes();
    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── updateConversation ────────────────────────────────────────────────────────

describe("updateConversation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates the title and returns the updated conversation", async () => {
    const updated = fakeConv({ title: "Renamed" });
    mockConversationFindOneAndUpdate.mockResolvedValue(updated);

    const req = makeReq({
      params: { conversationId: convId },
      body: { title: "Renamed" },
    });
    const res = makeRes();
    await updateConversation(req, res);

    expect(mockConversationFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: convId, userId },
      { title: "Renamed" },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Renamed" })
    );
  });

  it("returns 404 when conversation not owned", async () => {
    mockConversationFindOneAndUpdate.mockResolvedValue(null);
    const req = makeReq({
      params: { conversationId: convId },
      body: { title: "Renamed" },
    });
    const res = makeRes();
    await updateConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 400 when title is missing", async () => {
    const req = makeReq({ params: { conversationId: convId }, body: {} });
    const res = makeRes();
    await updateConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockConversationFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when title exceeds 120 characters", async () => {
    const req = makeReq({
      params: { conversationId: convId },
      body: { title: "x".repeat(121) },
    });
    const res = makeRes();
    await updateConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 for invalid ObjectId", async () => {
    const req = makeReq({
      params: { conversationId: "not-an-id" },
      body: { title: "title" },
    });
    const res = makeRes();
    await updateConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── deleteConversation ────────────────────────────────────────────────────────

describe("deleteConversation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes the conversation and returns 204", async () => {
    mockConversationFindOneAndDelete.mockResolvedValue(fakeConv());
    const req = makeReq({ params: { conversationId: convId } });
    const res = makeRes();
    await deleteConversation(req, res);

    expect(mockConversationFindOneAndDelete).toHaveBeenCalledWith({
      _id: convId,
      userId,
    });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("returns 404 when conversation not owned", async () => {
    mockConversationFindOneAndDelete.mockResolvedValue(null);
    const req = makeReq({ params: { conversationId: convId } });
    const res = makeRes();
    await deleteConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 for invalid ObjectId", async () => {
    const req = makeReq({ params: { conversationId: "bad-id" } });
    const res = makeRes();
    await deleteConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockConversationFindOneAndDelete).not.toHaveBeenCalled();
  });
});

// ── getConversations ──────────────────────────────────────────────────────────

describe("getConversations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns conversations with title from DB (not hardcoded)", async () => {
    const convA = fakeConv({ title: "Week 12 questions" });
    const convB = fakeConv({ _id: new mongoose.Types.ObjectId().toString(), title: "" });
    mockConversationFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([convA, convB]),
      }),
    });

    const req = makeReq();
    const res = makeRes();
    await getConversations(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result[0].title).toBe("Week 12 questions");
    expect(result[1].title).toBe("");
    // Ensure no hardcoded string
    expect(result[0].title).not.toBe("Pregnancy Assistant");
  });

  it("sorts by updatedAt desc", async () => {
    mockConversationFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const req = makeReq();
    const res = makeRes();
    await getConversations(req, res);

    const sortArg = mockConversationFind.mock.results[0].value.sort.mock.calls[0][0];
    expect(sortArg).toEqual({ updatedAt: -1 });
  });
});

// ── ask ───────────────────────────────────────────────────────────────────────

describe("ask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    triageCheck.mockReturnValue(false);
    askAya.mockResolvedValue({ content: "Aya response" });
  });

  it("uses existing conversation when conversationId is provided", async () => {
    const conv = fakeConv();
    mockConversationFindOne.mockResolvedValue(conv);
    mockConversationFindByIdAndUpdate.mockResolvedValue({});

    const req = makeReq({ body: { text: "hello", conversationId: convId } });
    const res = makeRes();
    await ask(req, res);

    expect(mockConversationFindOne).toHaveBeenCalledWith({
      _id: convId,
      userId,
    });
    expect(mockConversationCreate).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Aya response", conversationId: convId })
    );
  });

  it("auto-creates a conversation when no conversationId is provided", async () => {
    const conv = fakeConv({ title: "Tell me about" });
    mockConversationCreate.mockResolvedValue(conv);
    mockConversationFindByIdAndUpdate.mockResolvedValue({});

    const req = makeReq({ body: { text: "Tell me about week 20" } });
    const res = makeRes();
    await ask(req, res);

    expect(mockConversationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId, title: expect.any(String) })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: convId })
    );
  });

  it("auto-title truncates at 60 chars with ellipsis", async () => {
    const longText = "a".repeat(80);
    const conv = fakeConv();
    mockConversationCreate.mockResolvedValue(conv);
    mockConversationFindByIdAndUpdate.mockResolvedValue({});

    const req = makeReq({ body: { text: longText } });
    const res = makeRes();
    await ask(req, res);

    const createArg = mockConversationCreate.mock.calls[0][0];
    expect(createArg.title).toHaveLength(61); // 60 chars + "…"
    expect(createArg.title.endsWith("…")).toBe(true);
  });

  it("auto-title does not truncate when text is 60 chars or fewer", async () => {
    const shortText = "a".repeat(60);
    const conv = fakeConv();
    mockConversationCreate.mockResolvedValue(conv);
    mockConversationFindByIdAndUpdate.mockResolvedValue({});

    const req = makeReq({ body: { text: shortText } });
    const res = makeRes();
    await ask(req, res);

    const createArg = mockConversationCreate.mock.calls[0][0];
    expect(createArg.title).toBe(shortText);
    expect(createArg.title.endsWith("…")).toBe(false);
  });

  it("returns 404 when conversationId belongs to another user", async () => {
    mockConversationFindOne.mockResolvedValue(null);

    const req = makeReq({ body: { text: "hello", conversationId: convId } });
    const res = makeRes();
    await ask(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(askAya).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed conversationId", async () => {
    const req = makeReq({ body: { text: "hello", conversationId: "not-valid-id" } });
    const res = makeRes();
    await ask(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockConversationFindOne).not.toHaveBeenCalled();
  });

  it("returns 400 when text is missing", async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();
    await ask(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns triage message and logs flag when red flag detected", async () => {
    triageCheck.mockReturnValue(true);
    mockFlagCreate.mockResolvedValue({});
    const conv = fakeConv();
    mockConversationFindOne.mockResolvedValue(conv);

    const req = makeReq({ body: { text: "I am bleeding", conversationId: convId } });
    const res = makeRes();
    await ask(req, res);

    expect(mockFlagCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId, reason: "red_flag" })
    );
    expect(askAya).not.toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.triage).toBe(true);
    expect(payload.conversationId).toBe(convId);
  });
});

// ── getConversationMessages ───────────────────────────────────────────────────

describe("getConversationMessages", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns messages with title from DB (not hardcoded)", async () => {
    const conv = fakeConv({ title: "My thread", messages: [] });
    mockConversationFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(conv) });

    const req = makeReq({ params: { conversationId: convId }, query: {} });
    const res = makeRes();
    await getConversationMessages(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.chat.title).toBe("My thread");
    expect(payload.chat.title).not.toBe("Pregnancy Assistant");
  });

  it("returns empty string for title when conversation has no title", async () => {
    const conv = fakeConv({ title: "" });
    mockConversationFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(conv) });

    const req = makeReq({ params: { conversationId: convId }, query: {} });
    const res = makeRes();
    await getConversationMessages(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.chat.title).toBe("");
  });

  it("returns 404 for invalid ObjectId", async () => {
    const req = makeReq({ params: { conversationId: "bad" }, query: {} });
    const res = makeRes();
    await getConversationMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 when conversation not owned", async () => {
    mockConversationFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const req = makeReq({ params: { conversationId: convId }, query: {} });
    const res = makeRes();
    await getConversationMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
