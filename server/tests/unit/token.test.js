process.env.JWT_SECRET = process.env.JWT_SECRET || "unit-test-secret";
const { createToken, verifyToken } = require("../../utils/token");

describe("token utilities", () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("creates and verifies a token with payload", () => {
    const payload = { id: "123", role: "tester" };

    const token = createToken(payload, { expiresIn: "1h" });
    const decoded = verifyToken(token);

    expect(decoded.id).toBe(payload.id);
    expect(decoded.role).toBe(payload.role);
  });

  it("throws when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;

    expect(() => createToken({ id: "abc" })).toThrow("JWT_SECRET is not configured");
  });
});
