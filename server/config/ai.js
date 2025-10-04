const { Groq } = require("groq-sdk");
const { SYSTEM_PROMPT_AYA } = require("./prompts");
const { personaAya } = require("./persona");

const MODEL_NAME = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const MAX_TOKENS = Number(process.env.CHAT_MAX_TOKENS) || 1024;

// Red-flag patterns for triage detection
const RED_FLAG_PATTERNS = [
  /severe abdominal pain/i,
  /heavy.*bleeding|bright.*red.*bleeding/i,
  /fainting/i,
  /seizure/i,
  /chest pain|shortness of breath/i,
  /severe headache.*vision|vision changes/i,
  /severe swelling/i,
  /reduced.*fetal movement|no.*fetal movement/i,
  /signs.*preterm labor|preterm labor/i,
  /high fever/i,
  /severe dehydration/i,
];

const triageLine = (region) => {
  const regionMap = {
    UK: "This sounds urgent. Please call 999 or your maternity triage unit now. For non-emergency advice call NHS 111.",
    US: "This sounds urgent. Please call 911 or contact your obstetric provider immediately.",
    Global:
      "This sounds urgent. Please seek emergency care immediately or contact your maternity provider.",
  };
  return regionMap[region] || regionMap["Global"];
};

const triageCheck = (text) => {
  return RED_FLAG_PATTERNS.some((pattern) => pattern.test(text));
};

const fill = (tmpl, map) => {
  let result = tmpl;
  Object.keys(map).forEach((key) => {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), map[key] || "");
  });
  return result;
};

const buildMessages = ({ text, region = "UK", dayData = null }) => {
  const systemPrompt = fill(SYSTEM_PROMPT_AYA, {
    region,
    dayIndex: dayData?.dayIndex || "",
    babyUpdate: dayData?.babyUpdate || "",
    momUpdate: dayData?.momUpdate || "",
    tips: dayData?.tips || "",
  });

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: text },
  ];
};

const askAya = async ({
  text,
  region = "UK",
  dayData = null,
  stream = false,
}) => {
  // Check for red flags first
  if (triageCheck(text)) {
    return { triage: true, message: triageLine(region) };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is required");
  }

  const groq = new Groq({ apiKey });
  const messages = buildMessages({ text, region, dayData });

  const completion = await groq.chat.completions.create({
    model: MODEL_NAME,
    messages,
    temperature: 0.2,
    max_tokens: MAX_TOKENS,
    top_p: 1,
    stream,
  });

  if (stream) {
    return { rawStream: completion };
  }

  let content = completion.choices[0].message.content;

  // Strip code fences if present
  content = content.replace(/```[\s\S]*?```/g, "").trim();

  // Ensure disclaimer is present
  if (!content.includes("Educational only — not a diagnosis.")) {
    content += "\n\nEducational only — not a diagnosis.";
  }

  // Add sign-off if configured and not already present
  if (
    process.env.AI_SIGN_OFF === "true" &&
    !content.includes(personaAya.signOff)
  ) {
    content += `\n\n${personaAya.signOff}`;
  }

  return { content };
};

module.exports = {
  askAya,
  triageCheck,
  triageLine,
  buildMessages,
};
