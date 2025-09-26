import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch } from "../store/store.js";
import { enqueueToast } from "../store/ui/uiSlice.js";

const MAX_TEXT_LENGTH = 2000;
const MAX_CACHE_ENTRIES = 30;
const SILENCE_MP3 =
  "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const supportsAudio = typeof window !== "undefined" && typeof window.Audio !== "undefined";

const audioCache = new Map();
const listeners = new Set();
let sharedState = {
  isPlaying: false,
  isPaused: false,
  progress: 0,
  currentMessageId: null,
};

let queue = [];
let processingQueue = false;
let activeJob = null;
let audioElement = null;
let audioListenersAttached = false;
let audioUnlocked = false;
let unlockToastShown = false;
let dispatchRef = null;

const stripMarkup = (value) => {
  if (!value) {
    return "";
  }

  let output = `${value}`;
  output = output.replace(/```[\s\S]*?```/g, " ");
  output = output.replace(/`[^`]*`/g, " ");
  output = output.replace(/\!\[[^\]]*\]\([^)]*\)/g, " ");
  output = output.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  output = output.replace(/<[^>]+>/g, " ");
  output = output.replace(/[\*_~>#]/g, " ");
  output = output.replace(/\s+/g, " ");
  return output.trim();
};

const splitTextIntoChunks = (text) => {
  if (!text) {
    return [];
  }

  if (text.length <= MAX_TEXT_LENGTH) {
    return [text];
  }

  const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
  const chunks = [];
  let current = "";

  sentences.forEach((rawSentence) => {
    const sentence = rawSentence.trim();
    if (!sentence) {
      return;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= MAX_TEXT_LENGTH) {
      current = candidate;
      return;
    }

    if (current) {
      chunks.push(current);
    }

    if (sentence.length <= MAX_TEXT_LENGTH) {
      current = sentence;
      return;
    }

    let start = 0;
    while (start < sentence.length) {
      const slice = sentence.slice(start, start + MAX_TEXT_LENGTH).trim();
      if (slice) {
        chunks.push(slice);
      }
      start += MAX_TEXT_LENGTH;
    }
    current = "";
  });

  if (current) {
    chunks.push(current);
  }

  return chunks;
};

const delay = (ms) =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && window.setTimeout) {
      window.setTimeout(resolve, ms);
      return;
    }
    setTimeout(resolve, ms);
  });

const updateState = (patch) => {
  sharedState = { ...sharedState, ...patch };
  listeners.forEach((listener) => listener(sharedState));
};

const fetchAudioSegment = async (text, voiceId, signal) => {
  const payload = { text };
  if (voiceId) {
    payload.voiceId = voiceId;
  }

  const maxAttempts = 3;
  let attempt = 0;
  let lastError = null;

  while (attempt < maxAttempts) {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (response.status === 429 && attempt + 1 < maxAttempts) {
        await delay(600 * (attempt + 1));
        attempt += 1;
        continue;
      }

      if (!response.ok) {
        const error = new Error("Text-to-speech request failed");
        error.status = response.status;
        throw error;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Missing audio stream");
      }

      const parts = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          parts.push(value);
        }
      }

      return new Blob(parts, { type: "audio/mpeg" });
    } catch (error) {
      if (signal?.aborted || error.name === "AbortError") {
        const abortError = new Error("Aborted");
        abortError.name = "AbortError";
        throw abortError;
      }

      lastError = error;
      if (attempt + 1 >= maxAttempts) {
        throw error;
      }

      await delay(600 * (attempt + 1));
      attempt += 1;
    }
  }

  throw lastError ?? new Error("Failed to fetch audio");
};

const finalizeActiveJob = (status) => {
  if (!activeJob) {
    if (!queue.length) {
      updateState({
        isPlaying: false,
        isPaused: false,
        progress: status === "finished" ? 1 : 0,
        currentMessageId: null,
      });
    }
    return;
  }

  const job = activeJob;
  activeJob = null;

  if (!job.messageId && job.generatedUrl) {
    URL.revokeObjectURL(job.generatedUrl);
  }

  if (typeof job.resolve === "function") {
    job.resolve(status);
  }

  if (!queue.length) {
    updateState({
      isPlaying: false,
      isPaused: false,
      progress: status === "finished" ? 1 : 0,
      currentMessageId: null,
    });
  }

  if (audioElement) {
    audioElement.removeAttribute("src");
    audioElement.load();
  }
};

const handleAudioPlay = () => {
  updateState({ isPlaying: true, isPaused: false });
};

const handleAudioPause = () => {
  if (audioElement?.ended) {
    return;
  }
  updateState({ isPlaying: false, isPaused: true });
};

const handleAudioEnded = () => {
  finalizeActiveJob("finished");
  queueMicrotask(() => {
    processingQueue = false;
    void processQueue();
  });
};

const handleAudioTimeUpdate = () => {
  if (!audioElement || !Number.isFinite(audioElement.duration) || audioElement.duration <= 0) {
    return;
  }
  const ratio = audioElement.currentTime / audioElement.duration;
  if (Number.isFinite(ratio)) {
    updateState({ progress: Math.min(1, Math.max(0, ratio)) });
  }
};

const ensureAudioElement = () => {
  if (!supportsAudio) {
    return null;
  }

  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = "auto";
    audioElement.crossOrigin = "anonymous";
  }

  if (!audioListenersAttached) {
    audioElement.addEventListener("play", handleAudioPlay);
    audioElement.addEventListener("pause", handleAudioPause);
    audioElement.addEventListener("ended", handleAudioEnded);
    audioElement.addEventListener("timeupdate", handleAudioTimeUpdate);
    audioListenersAttached = true;
  }

  return audioElement;
};

const unlockAudioInternal = async () => {
  if (!supportsAudio) {
    return false;
  }

  if (audioUnlocked) {
    return true;
  }

  const audio = ensureAudioElement();
  if (!audio) {
    return false;
  }

  audio.muted = true;
  audio.src = SILENCE_MP3;

  try {
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audioUnlocked = true;
    unlockToastShown = false;
    return true;
  } catch (error) {
    return false;
  } finally {
    audio.muted = false;
    audio.removeAttribute("src");
    audio.load();
  }
};

const processQueue = async () => {
  if (processingQueue) {
    return;
  }

  if (!supportsAudio || !queue.length) {
    return;
  }

  const audio = ensureAudioElement();
  if (!audio) {
    return;
  }

  processingQueue = true;

  while (queue.length) {
    const job = queue.shift();
    if (!job || !job.text) {
      job?.resolve?.("skipped");
      continue;
    }

    job.cancelled = false;
    job.controller = job.controller || new AbortController();
    activeJob = job;
    updateState({
      currentMessageId: job.messageId ?? null,
      isPaused: false,
      progress: 0,
    });

    let audioUrl = job.messageId ? audioCache.get(job.messageId) : null;
    try {
      if (!audioUrl) {
        const segments = splitTextIntoChunks(job.text);
        if (!segments.length) {
          job.resolve?.("skipped");
          activeJob = null;
          continue;
        }

        const blobs = [];
        for (const segment of segments) {
          if (job.controller.signal.aborted) {
            throw new Error("Aborted");
          }
          const blob = await fetchAudioSegment(segment, job.voiceId, job.controller.signal);
          blobs.push(blob);
        }

        const combinedBlob =
          blobs.length === 1 ? blobs[0] : new Blob(blobs.map((blob) => blob.slice()), { type: "audio/mpeg" });
        audioUrl = URL.createObjectURL(combinedBlob);
        job.generatedUrl = audioUrl;

        if (job.messageId) {
          const previous = audioCache.get(job.messageId);
          if (previous && previous !== audioUrl) {
            URL.revokeObjectURL(previous);
          }
          audioCache.set(job.messageId, audioUrl);

          if (audioCache.size > MAX_CACHE_ENTRIES) {
            const oldest = audioCache.keys().next().value;
            const staleUrl = audioCache.get(oldest);
            if (staleUrl) {
              URL.revokeObjectURL(staleUrl);
            }
            audioCache.delete(oldest);
          }
        }
      }
    } catch (error) {
      activeJob = null;

      if (error.name === "AbortError" || job.controller.signal.aborted) {
        finalizeActiveJob("stopped");
        continue;
      }

      if (dispatchRef) {
        if (error.status === 401) {
          dispatchRef(
            enqueueToast({
              message: "Voice playback is not configured correctly.",
              tone: "danger",
            }),
          );
        } else if (error.status === 429) {
          dispatchRef(
            enqueueToast({
              message: "We're speaking a lot right now. Please try again soon.",
              tone: "warning",
            }),
          );
        } else {
          dispatchRef(
            enqueueToast({
              message: "Text-to-speech is currently unavailable.",
              tone: "warning",
            }),
          );
        }
      }

      finalizeActiveJob("error");
      continue;
    }

    const unlocked = await unlockAudioInternal();
    if (!unlocked) {
      queue.unshift(job);
      activeJob = null;
      processingQueue = false;

      if (dispatchRef && !unlockToastShown) {
        unlockToastShown = true;
        dispatchRef(
          enqueueToast({
            message: "Tap once to enable audio playback.",
            tone: "info",
            duration: 3000,
          }),
        );
      }
      return;
    }

    if (job.controller.signal.aborted || job.cancelled) {
      finalizeActiveJob("stopped");
      continue;
    }

    try {
      audio.src = audioUrl;
      audio.currentTime = 0;
      await audio.play();
      const status = await new Promise((resolve) => {
        job.resolve = resolve;
      });
      if (status !== "finished") {
        finalizeActiveJob(status);
      }
    } catch (error) {
      if (dispatchRef && error.name !== "AbortError") {
        dispatchRef(
          enqueueToast({
            message: "We couldn't play that audio clip.",
            tone: "warning",
          }),
        );
      }
      finalizeActiveJob(job.controller.signal.aborted ? "stopped" : "error");
    }
  }

  processingQueue = false;
  updateState({
    isPlaying: false,
    isPaused: false,
    progress: 0,
    currentMessageId: null,
  });
};

const stopAll = () => {
  if (!supportsAudio) {
    queue = [];
    activeJob = null;
    processingQueue = false;
    updateState({
      isPlaying: false,
      isPaused: false,
      progress: 0,
      currentMessageId: null,
    });
    return;
  }

  const audio = ensureAudioElement();
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
    audio.load();
  }

  queue = [];
  processingQueue = false;

  if (activeJob?.controller) {
    activeJob.controller.abort();
  }

  finalizeActiveJob("stopped");
};

const pauseCurrent = () => {
  const audio = ensureAudioElement();
  if (!audio) {
    return;
  }
  audio.pause();
};

const resumeCurrent = async () => {
  const audio = ensureAudioElement();
  if (!audio) {
    return;
  }

  const unlocked = await unlockAudioInternal();
  if (!unlocked) {
    if (dispatchRef && !unlockToastShown) {
      unlockToastShown = true;
      dispatchRef(
        enqueueToast({
          message: "Tap once to enable audio playback.",
          tone: "info",
          duration: 3000,
        }),
      );
    }
    return;
  }

  try {
    await audio.play();
  } catch (error) {
    if (dispatchRef && error.name !== "AbortError") {
      dispatchRef(
        enqueueToast({
          message: "We couldn't resume audio.",
          tone: "warning",
        }),
      );
    }
  }
};

const enqueueJob = (job) => {
  queue.push(job);
  void processQueue();
};

const useTTS = () => {
  const dispatch = useAppDispatch();
  dispatchRef = dispatch;

  const [state, setState] = useState(sharedState);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const listener = (next) => {
      if (mountedRef.current) {
        setState(next);
      }
    };

    listeners.add(listener);
    listener(sharedState);

    return () => {
      mountedRef.current = false;
      listeners.delete(listener);
    };
  }, []);

  const play = useCallback((rawText, options = {}) => {
    const stripped = stripMarkup(rawText);
    if (!supportsAudio || !stripped) {
      return Promise.resolve("skipped");
    }

    const trimmed = stripped.length > MAX_TEXT_LENGTH ? stripped.slice(0, MAX_TEXT_LENGTH) : stripped;
    const job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      text: trimmed,
      voiceId: options.voiceId,
      messageId: options.messageId ?? null,
      controller: new AbortController(),
      resolve: null,
      generatedUrl: null,
      cancelled: false,
    };

    const promise = new Promise((resolve) => {
      job.resolve = resolve;
    });

    enqueueJob(job);
    return promise;
  }, []);

  const pause = useCallback(() => {
    pauseCurrent();
  }, []);

  const resume = useCallback(() => {
    void resumeCurrent();
  }, []);

  const stop = useCallback(() => {
    stopAll();
  }, []);

  const unlock = useCallback(async () => {
    if (!supportsAudio) {
      return false;
    }

    const unlocked = await unlockAudioInternal();
    if (unlocked) {
      unlockToastShown = false;
      void processQueue();
    }
    return unlocked;
  }, []);

  const derivedState = useMemo(
    () => ({
      isPlaying: state.isPlaying,
      isPaused: state.isPaused,
      progress: state.progress,
      currentMessageId: state.currentMessageId,
    }),
    [state],
  );

  return {
    play,
    pause,
    resume,
    stop,
    unlock,
    isUnlocked: audioUnlocked,
    canPlayAudio: supportsAudio,
    state: derivedState,
  };
};

export default useTTS;
