const {
  allowedFrequencies,
  allowedGenders,
  normalizeBabyGender,
  normalizeHealthConsiderations,
  normalizeIsFirstPregnancy,
  validateOnboardingPayload,
} = require("../../utils/onboarding");

describe("onboarding validation helpers", () => {
  it("normalizes optional fields", () => {
    expect(normalizeBabyGender(" ")).toBeNull();
    expect(normalizeBabyGender(null)).toBeNull();
    expect(normalizeBabyGender("Female")).toBe("female");

    expect(normalizeHealthConsiderations("  Allergies  ")).toBe("Allergies");
    expect(normalizeHealthConsiderations(undefined)).toBe("");

    expect(normalizeIsFirstPregnancy(true)).toBe(true);
    expect(normalizeIsFirstPregnancy("false")).toBe(false);
    expect(normalizeIsFirstPregnancy("maybe")).toBeUndefined();
  });

  it("accepts only supported enum values", () => {
    expect(allowedGenders).toEqual([null, "female", "male", "unknown"]);
    expect(allowedFrequencies).toEqual(["daily", "few_times_week", "weekly"]);
  });

  it("validates payloads and returns sanitized data", () => {
    const payload = {
      dueDateOrPregnancyWeek: "  12 weeks ",
      babyGender: "Unknown",
      healthConsiderations: "  None",
      updateFrequency: "weekly",
      isFirstPregnancy: "true",
    };

    const result = validateOnboardingPayload(payload);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.value).toEqual({
      dueDateOrPregnancyWeek: "12 weeks",
      babyGender: "unknown",
      healthConsiderations: "None",
      updateFrequency: "weekly",
      isFirstPregnancy: true,
    });
  });

  it("collects validation errors for invalid payload", () => {
    const result = validateOnboardingPayload({
      dueDateOrPregnancyWeek: "",
      babyGender: "surprise",
      updateFrequency: "hourly",
      isFirstPregnancy: "maybe",
    });

    expect(result.isValid).toBe(false);
    expect(result.value).toBeNull();
    expect(result.errors).toEqual([
      "dueDateOrPregnancyWeek is required and must be a string.",
      "babyGender must be one of female, male, unknown or null.",
      "updateFrequency is invalid.",
      "isFirstPregnancy must be a boolean value.",
    ]);
  });
});
