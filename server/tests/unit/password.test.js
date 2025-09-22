const { hashPassword, verifyPassword } = require("../../utils/password");

describe("password utilities", () => {
  it("hashes and verifies passwords correctly", async () => {
    const plain = "MySecurePassword123";

    const hashed = await hashPassword(plain);

    expect(hashed).not.toEqual(plain);
    expect(typeof hashed).toBe("string");

    const matches = await verifyPassword(plain, hashed);
    expect(matches).toBe(true);

    const mismatch = await verifyPassword("wrong", hashed);
    expect(mismatch).toBe(false);
  });

  it("throws if plain password is empty", async () => {
    await expect(hashPassword("")).rejects.toThrow(
      "A non-empty password string is required"
    );
  });

  it("throws if hashed password is missing", async () => {
    await expect(verifyPassword("test", "")).rejects.toThrow(
      "A hashed password is required for verification"
    );
  });
});
