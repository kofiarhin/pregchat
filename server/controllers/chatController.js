const mongoose = require("mongoose");
const { askAya, triageCheck } = require("../config/ai");
const Conversation = require("../models/Conversation");
const Flag = require("../models/Flag");
const Pregnancy = require("../models/Pregnancy");
const DailyContent = require("../models/DailyContent");

const DEFAULT_PAGE = 0;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePage = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }
  return DEFAULT_PAGE;
};

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isInteger(parsed) && parsed > 0) {
    return Math.min(parsed, MAX_LIMIT);
  }
  return DEFAULT_LIMIT;
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ userId }).sort({
      updatedAt: -1,
    });

    // Map to the expected format
    const chats = conversations.map((conv) => ({
      id: conv._id,
      title: "Pregnancy Assistant", // Default title since model doesn't have title
      updatedAt: conv.updatedAt,
      createdAt: conv.createdAt,
    }));

    res.json(chats);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

const ask = async (req, res) => {
  try {
    const {
      message,
      text: textPayload,
      stream: streamPayload = false,
    } = req.body || {};

    const queryStream = req.query?.stream;
    const stream =
      typeof streamPayload === "boolean"
        ? streamPayload
        : typeof queryStream === "string"
        ? ["1", "true", "yes"].includes(queryStream.toLowerCase())
        : Boolean(streamPayload);

    const rawText =
      typeof message === "string" && message.trim().length
        ? message
        : textPayload;
    const text =
      typeof rawText === "string"
        ? rawText.trim()
        : typeof message === "string"
        ? message.trim()
        : "";

    if (!text) {
      return res.status(400).json({ error: "Message text is required" });
    }

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

      const rawStream = result.rawStream;
      for await (const chunk of rawStream) {
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

const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parsePage(req.query?.page);
    const limit = parseLimit(req.query?.limit);
    const userId = req.user?._id;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    }).lean();

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const allMessages = Array.isArray(conversation.messages)
      ? conversation.messages
      : [];
    const total = allMessages.length;
    const start = page * limit;
    const messages =
      start < total ? allMessages.slice(start, start + limit) : [];
    const hasMore = start + limit < total;

    const payload = {
      messages,
      hasMore,
      total,
      page,
      limit,
      chat: {
        id: conversation._id.toString(),
        title: "Pregnancy Assistant",
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    };

    if (page === 0) {
      payload.allMessages = allMessages;
    }

    return res.json(payload);
  } catch (error) {
    console.error("Get conversation messages error:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

module.exports = {
  ask,
  getConversations,
  getConversationMessages,
};
