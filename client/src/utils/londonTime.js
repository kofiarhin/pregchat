const LONDON_TZ = "Europe/London";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON_TZ,
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON_TZ,
  weekday: "short",
  day: "2-digit",
  month: "short",
});

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: LONDON_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const getTimeZoneOffsetMinutes = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  });

  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );

  return (asUTC - date.getTime()) / 60000;
};

const getLondonOffsetMinutes = (date) => getTimeZoneOffsetMinutes(date, LONDON_TZ);

const getLondonParts = (date) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  });

  return map;
};

const createUtcDateFromLondon = (year, month, day, hour, minute) => {
  const base = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = getLondonOffsetMinutes(base);
  return new Date(base.getTime() - offset * 60000);
};

const incrementLondonDay = (parts, days = 1) => {
  const base = createUtcDateFromLondon(parts.year, parts.month, parts.day, 12, 0);
  const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  const nextParts = getLondonParts(next);

  return {
    year: Number(nextParts.year),
    month: Number(nextParts.month),
    day: Number(nextParts.day),
  };
};

export const getLondonRangeIso = (days) => {
  const now = new Date();
  const parts = getLondonParts(now);
  const start = createUtcDateFromLondon(
    Number(parts.year),
    Number(parts.month),
    Number(parts.day),
    0,
    0
  );

  let cursor = {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };

  for (let index = 1; index < days; index += 1) {
    cursor = incrementLondonDay(cursor, 1);
  }

  const end = createUtcDateFromLondon(cursor.year, cursor.month, cursor.day, 0, 0);

  return {
    fromISO: start.toISOString(),
    toISO: end.toISOString(),
  };
};

export const groupSlotsByDay = (slots = []) => {
  const map = new Map();

  slots.forEach((iso) => {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = dateKeyFormatter.format(date);

    if (!map.has(key)) {
      map.set(key, {
        key,
        label: dateFormatter.format(date),
        slots: [],
      });
    }

    map.get(key).slots.push({
      iso,
      label: timeFormatter.format(date),
    });
  });

  return Array.from(map.values());
};

export const formatLondonDateTime = (iso) => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
};

export const formatLondonRange = (startIso, endIso) => {
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }

  return `${dateFormatter.format(start)} · ${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
};

export const isSlotInPast = (iso) => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return true;
  }

  return date.getTime() < Date.now();
};
