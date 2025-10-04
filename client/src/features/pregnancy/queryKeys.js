export const pregnancyKeys = {
  all: ["pregnancy"],
  today: () => ["pregnancy", "today"],
  day: (day) => ["pregnancy", "day", day],
  profile: () => ["pregnancy", "profile"],
};
