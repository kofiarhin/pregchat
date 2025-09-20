const { askAya, triageCheck } = require("../config/ai");
const Conversation = require("../models/Conversation");
const Flag = require("../models/Flag");
const Pregnancy = require("../models/Pregnancy");
const DailyContent = require("../models/DailyContent");

const ask = async (req, res) => {
  try {
    const { text, stream = false } = req.body;
    const userId = req.user._id;

    // Get user's pregnancy profile for day context
    const pregnancy = await Pregnancy.findOne({ userId });
    let dayData = null;

    if (pregnancy) {
      const dayIndex = pregnancy.calculateDayIndex();
      const dailyContent = await DailyContent.findOne({ day: dayIndex });

      if (dailyContent) {
        dayData = {
          dayIndex,
          babyUpdate: dailyContent.babyUpdate,
          momUpdate: dailyContent.momUpdate,
          tips: dailyContent.tips,
        };
      }
    }

    // Check for red flags
    if (triageCheck(text)) {
      // Log the flag
      await Flag.create({
        userId,
        text,
        reason: "red_flag",
      });

      return res.json({
        triage: true,
        message: getTriageMessage(req.user.region),
      });
    }

    // Get AI response
    const result = await askAya({
      text,
      region: req.user.region,
      dayData,
      stream,
    });

    if (stream) {
      // Handle streaming response
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = result.rawStream;
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(content);
        }
      }
      res.end();
    } else {
      // Save conversation
      await Conversation.findOneAndUpdate(
        { userId },
        {
          $push: {
            messages: [
              { role: "user", content: text, timestamp: new Date() },
              {
                role: "assistant",
                content: result.content,
                timestamp: new Date(),
              },
            ],
          },
        },
        { upsert: true, new: true }
      );

      res.json({ content: result.content });
    }
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat request" });
  }
};

const getTriageMessage = (region) => {
  const messages = {
    UK: "This sounds urgent. Please call 999 or your maternity triage unit now. For non-emergency advice call NHS 111.",
    US: "This sounds urgent. Please call 911 or contact your obstetric provider immediately.",
    Global:
      "This sounds urgent. Please seek emergency care immediately or contact your maternity provider.",
  };
  return messages[region] || messages["Global"];
};

module.exports = {
  ask,
};
