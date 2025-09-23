const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toNumberOrNull = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getZonedDateParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  return parts.reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
};

const getUtcMsFromParts = (parts) =>
  Date.UTC(
    Number.parseInt(parts.year, 10),
    Number.parseInt(parts.month, 10) - 1,
    Number.parseInt(parts.day, 10)
  );

const computeGA = (profile = {}, timeZone = "Europe/London") => {
  const today = new Date();
  const todayParts = getZonedDateParts(today, timeZone);
  const dateKey = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;

  const dueDate = normalizeDate(profile.dueDate);
  let estimatedDays = null;

  if (dueDate) {
    const dueParts = getZonedDateParts(dueDate, timeZone);
    const diffDays = Math.round(
      (getUtcMsFromParts(dueParts) - getUtcMsFromParts(todayParts)) /
        MS_PER_DAY
    );
    estimatedDays = 280 - diffDays;
  } else {
    const weeks = toNumberOrNull(profile.weeks);
    const days = toNumberOrNull(profile.days);

    if (weeks != null || days != null) {
      estimatedDays = (weeks ?? 0) * 7 + (days ?? 0);
    }
  }

  if (estimatedDays == null || Number.isNaN(estimatedDays)) {
    const error = new Error("Gestational age is unavailable");
    error.code = "GA_UNAVAILABLE";
    throw error;
  }

  const roundedDays = Math.round(estimatedDays);
  const clampedDays = Math.max(0, Math.min(294, roundedDays));
  const week = Math.floor(clampedDays / 7);
  const day = clampedDays % 7;

  return {
    week,
    day,
    GA_days: clampedDays,
    rawDays: roundedDays,
    dateKey,
  };
};

module.exports = {
  computeGA,
};
