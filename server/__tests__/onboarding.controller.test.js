const { upsertMyDetails, getMyDetails } = require("../controllers/onboarding.controller");

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockFindOneAndUpdate = jest.fn();
const mockFindOne = jest.fn();

jest.mock("../models/UserDetails", () => ({
  findOneAndUpdate: (...args) => mockFindOneAndUpdate(...args),
  findOne: (...args) => mockFindOne(...args),
}));

jest.mock("../utils/onboarding", () => ({
  validateOnboardingPayload: (payload) => {
    // Minimal real-like validation: require dueDateOrPregnancyWeek
    if (!payload.dueDateOrPregnancyWeek) {
      return { isValid: false, errors: ["dueDateOrPregnancyWeek is required and must be a string."], value: null };
    }
    return {
      isValid: true,
      errors: [],
      value: {
        dueDateOrPregnancyWeek: payload.dueDateOrPregnancyWeek,
        babyGender: payload.babyGender ?? null,
        updateFrequency: payload.updateFrequency ?? "daily",
        isFirstPregnancy: payload.isFirstPregnancy ?? true,
        healthConsiderations: payload.healthConsiderations ?? "",
      },
    };
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeReq = (body = {}, user = {}) => ({
  body,
  user: {
    _id: "user-123",
    onboardingCompletedAt: null,
    save: jest.fn().mockResolvedValue(true),
    ...user,
  },
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const validPayload = {
  dueDateOrPregnancyWeek: "provided",
  babyGender: "female",
  updateFrequency: "daily",
  isFirstPregnancy: true,
  healthConsiderations: "",
};

const fakeDetails = {
  _id: "detail-1",
  user: "user-123",
  ...validPayload,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("onboarding.controller — upsertMyDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saves user details and returns them", async () => {
    mockFindOneAndUpdate.mockResolvedValue(fakeDetails);

    const req = makeReq(validPayload);
    const res = makeRes();

    await upsertMyDetails(req, res);

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { user: req.user._id },
      expect.objectContaining({ dueDateOrPregnancyWeek: "provided" }),
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: "detail-1" }));
  });

  it("does NOT write onboardingCompletedAt to the user document", async () => {
    mockFindOneAndUpdate.mockResolvedValue(fakeDetails);

    const req = makeReq(validPayload);
    const res = makeRes();

    await upsertMyDetails(req, res);

    // The user's save method must not have been called
    expect(req.user.save).not.toHaveBeenCalled();
    // The onboardingCompletedAt field on the user must remain null
    expect(req.user.onboardingCompletedAt).toBeNull();
  });

  it("does NOT write onboardingCompletedAt even when it was previously null", async () => {
    mockFindOneAndUpdate.mockResolvedValue(fakeDetails);

    const req = makeReq(validPayload, { onboardingCompletedAt: null });
    const res = makeRes();

    await upsertMyDetails(req, res);

    expect(req.user.save).not.toHaveBeenCalled();
    expect(req.user.onboardingCompletedAt).toBeNull();
  });

  it("returns 400 when payload is invalid", async () => {
    const req = makeReq({ babyGender: "female" }); // missing dueDateOrPregnancyWeek
    const res = makeRes();

    await upsertMyDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    expect(req.user.save).not.toHaveBeenCalled();
  });

  it("returns 500 on database error without writing onboardingCompletedAt", async () => {
    mockFindOneAndUpdate.mockRejectedValue(new Error("DB error"));

    const req = makeReq(validPayload);
    const res = makeRes();

    await upsertMyDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(req.user.save).not.toHaveBeenCalled();
    expect(req.user.onboardingCompletedAt).toBeNull();
  });
});

describe("onboarding.controller — getMyDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns details when found", async () => {
    mockFindOne.mockReturnValue({ lean: () => Promise.resolve(fakeDetails) });

    const req = makeReq({});
    const res = makeRes();

    await getMyDetails(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: "detail-1" }));
  });

  it("returns 404 when no details found", async () => {
    mockFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });

    const req = makeReq({});
    const res = makeRes();

    await getMyDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });
});
