export const appointmentKeys = {
  all: ["appointments"],
  midwives: () => ["appointments", "midwives"],
  midwife: (id) => ["appointments", "midwives", id],
  availability: ({ midwifeId, fromISO, toISO }) => [
    "appointments",
    "availability",
    midwifeId,
    fromISO,
    toISO,
  ],
  availabilityRoot: (midwifeId) => ["appointments", "availability", midwifeId],
  myAppointments: (userId) => ["appointments", "mine", userId],
};
