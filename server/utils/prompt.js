const descriptors = [
  {
    maxWeek: 8,
    text: "depicting a tiny embryo with emerging limb buds and translucent skin",
  },
  {
    maxWeek: 12,
    text: "showing a small fetus with a prominent head-to-body ratio and gentle hand positioning near the chest",
  },
  {
    maxWeek: 16,
    text: "highlighting lengthening limbs, defined facial profile, and floating in amniotic fluid",
  },
  {
    maxWeek: 20,
    text: "emphasizing proportional growth, visible fingers and toes, and a relaxed curled pose",
  },
  {
    maxWeek: 24,
    text: "illustrating growing muscle tone, slightly open hands, and soft vernix details on the skin",
  },
  {
    maxWeek: 28,
    text: "capturing rounded features, subtle eyelid definition, and gentle flexed limbs",
  },
  {
    maxWeek: 32,
    text: "showing a fuller body, tucked arms, and calm expression within the womb",
  },
  {
    maxWeek: 36,
    text: "featuring plump limbs, smooth skin texture, and a peaceful fetal tuck",
  },
];

const buildWeekPrompt = (week) => {
  const safeWeek = Number.isFinite(week) ? Math.max(0, week) : 0;
  const descriptor =
    descriptors.find((entry) => safeWeek <= entry.maxWeek) ||
    descriptors[descriptors.length - 1];

  const prompt =
    `medical-illustration style fetus at ${safeWeek} weeks gestation, side profile, clean cutaway womb context, neutral background, soft studio light, high detail, sharp focus, ${descriptor.text}, no gore, no blood, no watermark, no text, no extra limbs`;

  return { prompt };
};

module.exports = {
  buildWeekPrompt,
};
