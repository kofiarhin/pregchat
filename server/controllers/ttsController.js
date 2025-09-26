const { Readable } = require("stream");

const MAX_TEXT_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 40;
const rateLimitBuckets = new Map();

const cleanupExpiredBuckets = (now) => {
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (now - bucket.start >= RATE_LIMIT_WINDOW_MS) {
      rateLimitBuckets.delete(key);
    }
  }
};

const isRateLimited = (ip) => {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  if (!rateLimitBuckets.has(ip)) {
    rateLimitBuckets.set(ip, { start: now, count: 1 });
    return false;
  }

  const bucket = rateLimitBuckets.get(ip);
  if (now - bucket.start >= RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(ip, { start: now, count: 1 });
    return false;
  }

  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
};

const createErrorResponse = (res, status, message, headers = {}) => {
  Object.entries(headers).forEach(([key, value]) => {
    if (value !== undefined) {
      res.setHeader(key, value);
    }
  });
  res.status(status).json({ error: message });
};

const forwardAudioStream = async (upstreamResponse, res) => {
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");

  const body = upstreamResponse.body;
  if (!body) {
    throw new Error("Missing ElevenLabs audio stream");
  }

  const readable = Readable.fromWeb(body);
  await new Promise((resolve, reject) => {
    readable.on("error", reject);
    res.on("close", resolve);
    res.on("finish", resolve);
    readable.pipe(res);
  });
};

const sanitizeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const streamTts = async (req, res) => {
  if (!process.env.ELEVENLABS_API_KEY) {
    return createErrorResponse(res, 500, "Text-to-speech is not configured");
  }

  if (isRateLimited(req.ip || "unknown")) {
    return createErrorResponse(
      res,
      429,
      "Too many text-to-speech requests. Please try again shortly.",
      { "Retry-After": "5", "X-Retry-In": "5000" },
    );
  }

  const text = sanitizeText(req.body?.text);
  if (!text) {
    return createErrorResponse(res, 400, "Text is required");
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return createErrorResponse(res, 413, "Text exceeds the 2000 character limit");
  }

  const defaultVoiceId = process.env.ELEVENLABS_VOICE_ID;
  const voiceId = sanitizeText(req.body?.voiceId) || defaultVoiceId;

  if (!voiceId) {
    return createErrorResponse(res, 500, "No ElevenLabs voice configured");
  }

  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

  const abortController = new AbortController();
  const handleClose = () => {
    abortController.abort();
  };

  req.on("close", handleClose);

  try {
    const upstreamResponse = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        optimize_streaming_latency: 3,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
        },
      }),
      signal: abortController.signal,
    });

    if (!upstreamResponse.ok) {
      if (upstreamResponse.status === 401) {
        return createErrorResponse(res, 401, "Invalid ElevenLabs API key");
      }

      if (upstreamResponse.status === 429) {
        const retryAfter = upstreamResponse.headers.get("retry-after") || "2";
        return createErrorResponse(
          res,
          429,
          "ElevenLabs rate limit reached. Please retry shortly.",
          { "Retry-After": retryAfter, "X-Retry-In": `${Number.parseInt(retryAfter, 10) * 1000 || 2000}` },
        );
      }

      if (upstreamResponse.status >= 500) {
        return createErrorResponse(res, 502, "Text-to-speech provider error");
      }

      return createErrorResponse(res, upstreamResponse.status, "Text-to-speech request failed");
    }

    await forwardAudioStream(upstreamResponse, res);
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("[tts] proxy error", error);
    }

    createErrorResponse(res, 502, "Text-to-speech request failed");
  } finally {
    req.removeListener("close", handleClose);
  }
};

module.exports = {
  streamTts,
};
