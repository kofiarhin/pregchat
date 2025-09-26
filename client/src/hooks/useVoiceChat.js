import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const getSpeechRecognition = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition;
};

const detectFullDuplexSupport = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator?.userAgent || "";
  const isIOS = /iP(ad|hone|od)/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome|CriOS|Android/i.test(userAgent);

  return !(isIOS || isSafari);
};

const DEFAULT_ERROR_MESSAGE = "Voice input unavailable.";

const ERROR_MESSAGES = {
  "no-speech": "No speech detected.",
  "audio-capture": "Microphone not available.",
  "not-allowed": "Microphone permission denied.",
  "service-not-allowed": "Microphone permission denied.",
  network: "We couldn't reach the speech service.",
  aborted: "Speech recognition stopped unexpectedly.",
};

const normalizeErrorKey = (value) => {
  if (!value) {
    return null;
  }

  const key = `${value}`.toLowerCase();

  if (ERROR_MESSAGES[key]) {
    return key;
  }

  if (key === "notallowederror" || key === "securityerror") {
    return "not-allowed";
  }

  if (key === "notfounderror") {
    return "audio-capture";
  }

  return null;
};

const useVoiceChat = () => {
  const Recognition = useMemo(() => getSpeechRecognition(), []);
  const recognitionRef = useRef(null);
  const shouldResumeRef = useRef(false);
  const expectedStopRef = useRef(false);
  const restartTimeoutRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [voiceError, setVoiceError] = useState(null);

  const supportsFullDuplex = useMemo(() => detectFullDuplexSupport(), []);
  const canUseVoice = Boolean(Recognition);

  const resetTranscript = useCallback(() => {
    setLastTranscript("");
  }, []);

  const clearRestartTimeout = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    expectedStopRef.current = true;
    shouldResumeRef.current = false;
    clearRestartTimeout();
    setListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
  }, [clearRestartTimeout]);

  const handleResult = useCallback((event) => {
    if (!event.results) {
      return;
    }

    let transcript = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (result.isFinal && result[0] && result[0].transcript) {
        transcript = `${transcript} ${result[0].transcript}`.trim();
      }
    }

    if (transcript) {
      setLastTranscript(transcript);
    }
  }, []);

  const handleRecognitionFailure = useCallback(
    (error) => {
      const key = normalizeErrorKey(error);
      const message = ERROR_MESSAGES[key] || DEFAULT_ERROR_MESSAGE;

      setVoiceError(message);
      shouldResumeRef.current = false;
      expectedStopRef.current = true;
      clearRestartTimeout();
      setListening(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
        recognitionRef.current = null;
      }
    },
    [clearRestartTimeout],
  );

  const ensureRecognition = useCallback(() => {
    if (!Recognition) {
      return null;
    }

    if (!recognitionRef.current) {
      const instance = new Recognition();
      instance.continuous = supportsFullDuplex;
      instance.interimResults = false;
      instance.lang = window?.navigator?.language || "en-US";

      instance.onresult = handleResult;
      instance.onstart = () => {
        setListening(true);
        expectedStopRef.current = false;
        setVoiceError(null);
      };

      instance.onend = () => {
        setListening(false);

        if (expectedStopRef.current || !shouldResumeRef.current) {
          expectedStopRef.current = false;
          return;
        }

        clearRestartTimeout();
        restartTimeoutRef.current = window.setTimeout(() => {
          try {
            instance.start();
          } catch {
            /* ignore */
          }
        }, 150);
      };

      instance.onerror = (event) => {
        handleRecognitionFailure(event?.error);
      };

      recognitionRef.current = instance;
    }

    return recognitionRef.current;
  }, [Recognition, clearRestartTimeout, handleRecognitionFailure, handleResult, supportsFullDuplex]);

  const startListening = useCallback(() => {
    if (!Recognition) {
      return;
    }

    const recognition = ensureRecognition();

    if (!recognition) {
      return;
    }

    shouldResumeRef.current = true;
    expectedStopRef.current = false;
    setVoiceError(null);

    try {
      recognition.start();
    } catch (error) {
      const normalized = normalizeErrorKey(error?.name);

      if (normalized) {
        handleRecognitionFailure(normalized);
        return;
      }

      try {
        recognition.stop();
        recognition.start();
      } catch (secondaryError) {
        const secondary = normalizeErrorKey(secondaryError?.name);
        if (secondary) {
          handleRecognitionFailure(secondary);
        } else {
          handleRecognitionFailure(secondaryError?.name || null);
        }
      }
    }
  }, [Recognition, ensureRecognition, handleRecognitionFailure]);

  useEffect(() => () => {
    stopListening();
    clearRestartTimeout();
  }, [stopListening, clearRestartTimeout]);

  return {
    canUseVoice,
    listening,
    startListening,
    stopListening,
    lastTranscript,
    resetTranscript,
    supportsFullDuplex,
    voiceError,
  };
};

export default useVoiceChat;
