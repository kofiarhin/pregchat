const LONDON_TZ = "Europe/London";
const WEEKDAY_LOOKUP = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const parseTimeToMinutes = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const [hourStr, minuteStr] = value.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
};

const formatMinutesToTime = (minutes) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

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
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
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
  const baseUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offsetMinutes = getLondonOffsetMinutes(baseUtc);
  return new Date(baseUtc.getTime() - offsetMinutes * 60000);
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

const isAfterDay = (a, b) => {
  if (a.year !== b.year) {
    return a.year > b.year;
  }

  if (a.month !== b.month) {
    return a.month > b.month;
  }

  return a.day > b.day;
};

const generateTimeSlots = ({ startTime, endTime, durationMin }) => {
  const duration = Number(durationMin);
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    startMinutes === null ||
    endMinutes === null ||
    startMinutes >= endMinutes
  ) {
    return [];
  }

  const slots = [];

  for (let minute = startMinutes; minute + duration <= endMinutes; minute += duration) {
    slots.push(formatMinutesToTime(minute));
  }

  return slots;
};

const buildAvailability = ({ midwife, fromDate, toDate }) => {
  if (!midwife || !Array.isArray(midwife.availability)) {
    return [];
  }

  const duration = Number(midwife.appointmentDurationMin) || 30;
  const fromPartsRaw = getLondonParts(fromDate);
  const toPartsRaw = getLondonParts(toDate);

  const current = {
    year: Number(fromPartsRaw.year),
    month: Number(fromPartsRaw.month),
    day: Number(fromPartsRaw.day),
  };

  const end = {
    year: Number(toPartsRaw.year),
    month: Number(toPartsRaw.month),
    day: Number(toPartsRaw.day),
  };

  const now = new Date();
  const slots = [];
  let cursor = { ...current };

  while (!isAfterDay(cursor, end)) {
    const middayUtc = createUtcDateFromLondon(cursor.year, cursor.month, cursor.day, 12, 0);
    const middayParts = getLondonParts(middayUtc);
    const weekday = WEEKDAY_LOOKUP[middayParts.weekday];

    if (typeof weekday === "number") {
      const matchingBlocks = midwife.availability.filter(
        (entry) => entry.weekday === weekday
      );

      matchingBlocks.forEach((block) => {
        const times = generateTimeSlots({
          startTime: block.startTime,
          endTime: block.endTime,
          durationMin: duration,
        });

        times.forEach((time) => {
          const [hourStr, minuteStr] = time.split(":");
          const hour = Number(hourStr);
          const minute = Number(minuteStr);
          const slotUtc = createUtcDateFromLondon(cursor.year, cursor.month, cursor.day, hour, minute);

          if (slotUtc.getTime() >= now.getTime()) {
            slots.push(slotUtc);
          }
        });
      });
    }

    cursor = incrementLondonDay(cursor, 1);
  }

  return slots.sort((a, b) => a.getTime() - b.getTime());
};

const getLondonDayBounds = (date) => {
  const parts = getLondonParts(date);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const start = createUtcDateFromLondon(year, month, day, 0, 0);
  const nextDay = incrementLondonDay({ year, month, day }, 1);
  const end = createUtcDateFromLondon(nextDay.year, nextDay.month, nextDay.day, 0, 0);

  return { start, end };
};

const filterOutConflicts = ({ candidateSlots, existingAppointments, durationMin }) => {
  if (!Array.isArray(candidateSlots)) {
    return [];
  }

  const duration = Number(durationMin) || 30;
  const slotLengthMs = duration * 60 * 1000;
  const activeAppointments = (existingAppointments || []).filter(
    (appointment) => appointment.status !== "cancelled"
  );

  return candidateSlots.filter((slot) => {
    const slotStart = slot.getTime();
    const slotEnd = slotStart + slotLengthMs;

    return activeAppointments.every((appointment) => {
      const appointmentStart = new Date(appointment.start).getTime();
      const appointmentEnd = new Date(appointment.end).getTime();

      return appointmentEnd <= slotStart || appointmentStart >= slotEnd;
    });
  });
};

module.exports = {
  generateTimeSlots,
  buildAvailability,
  filterOutConflicts,
  getLondonDayBounds,
};
