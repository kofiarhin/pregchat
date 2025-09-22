const allowedGenders = [null, "female", "male", "unknown"];
const allowedFrequencies = ["daily", "few_times_week", "weekly"];

const normalizeBabyGender = (rawGender) => {
  if (rawGender === undefined) {
    return null;
  }

  if (rawGender === null) {
    return null;
  }

  const value = String(rawGender).trim().toLowerCase();

  if (value.length === 0) {
    return null;
  }

  if (!allowedGenders.includes(value)) {
    return undefined;
  }

  return value;
};

const normalizeHealthConsiderations = (input) => {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim();
};

const normalizeIsFirstPregnancy = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return undefined;
};

const validateOnboardingPayload = (payload = {}) => {
  const errors = [];
  const normalized = {};

  if (
    typeof payload.dueDateOrPregnancyWeek !== "string" ||
    payload.dueDateOrPregnancyWeek.trim().length === 0
  ) {
    errors.push("dueDateOrPregnancyWeek is required and must be a string.");
  } else {
    normalized.dueDateOrPregnancyWeek = payload.dueDateOrPregnancyWeek.trim();
  }

  const gender = normalizeBabyGender(payload.babyGender);
  if (gender === undefined) {
    errors.push("babyGender must be one of female, male, unknown or null.");
  } else {
    normalized.babyGender = gender;
  }

  const frequency = payload.updateFrequency;
  if (!allowedFrequencies.includes(frequency)) {
    errors.push("updateFrequency is invalid.");
  } else {
    normalized.updateFrequency = frequency;
  }

  const isFirstPregnancy = normalizeIsFirstPregnancy(payload.isFirstPregnancy);
  if (typeof isFirstPregnancy !== "boolean") {
    errors.push("isFirstPregnancy must be a boolean value.");
  } else {
    normalized.isFirstPregnancy = isFirstPregnancy;
  }

  normalized.healthConsiderations = normalizeHealthConsiderations(
    payload.healthConsiderations
  );

  return {
    isValid: errors.length === 0,
    errors,
    value: errors.length === 0 ? normalized : null,
  };
};

module.exports = {
  allowedFrequencies,
  allowedGenders,
  normalizeBabyGender,
  normalizeHealthConsiderations,
  normalizeIsFirstPregnancy,
  validateOnboardingPayload,
};
