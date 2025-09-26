import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const getSpeechRecognition = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition;
};

const useVoiceChat = () => {
  const Recognition = useMemo(() => getSpeechRecognition(), []);
  const recognitionRef = useRef(null);
  const isExpectedStopRef = useRef(false);
  const shouldBeListeningRef = useRef(false);
  const restartTimeoutRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");

  const canListen = Boolean(Recognition);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  const clearRestartTimeout = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setLastTranscript("");
  }, []);

  const stopListening = useCallback(() => {
    isExpectedStopRef.current = true;
    shouldBeListeningRef.current = false;
    clearRestartTimeout();
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Some browsers throw if stop is called while inactive; ignore.
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

  const ensureRecognition = useCallback(() => {
    if (!Recognition) {
      return null;
    }

    if (!recognitionRef.current) {
      const instance = new Recognition();
      instance.continuous = true;
      instance.interimResults = false;
      instance.lang = window?.navigator?.language || "en-US";

      instance.onresult = handleResult;
      instance.onstart = () => {
        setIsListening(true);
        isExpectedStopRef.current = false;
      };

      instance.onend = () => {
        setIsListening(false);

        if (isExpectedStopRef.current || !shouldBeListeningRef.current) {
          isExpectedStopRef.current = false;
          return;
        }

        // iOS Safari often stops unexpectedly; restart to keep continuous mode alive.
        clearRestartTimeout();
        restartTimeoutRef.current = setTimeout(() => {
          try {
            instance.start();
          } catch (error) {
            // Restart may fail if the microphone is busy; ignore and wait for next opportunity.
          }
        }, 400);
      };

      instance.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          shouldBeListeningRef.current = false;
          isExpectedStopRef.current = true;
        }
      };

      recognitionRef.current = instance;
    }

    return recognitionRef.current;
  }, [Recognition, clearRestartTimeout, handleResult]);

  const startListening = useCallback(() => {
    if (!Recognition) {
      return;
    }

    const recognition = ensureRecognition();

    if (!recognition) {
      return;
    }

    shouldBeListeningRef.current = true;
    isExpectedStopRef.current = false;

    try {
      recognition.start();
    } catch (error) {
      // Restart if already active.
      try {
        recognition.stop();
        recognition.start();
      } catch (retryError) {
        // Ignore if retry fails; browser may still be starting.
      }
    }
  }, [Recognition, ensureRecognition]);

  const speak = useCallback((text, options = {}) => {
    if (!canSpeak || !text) {
      return undefined;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    if (options.pitch) {
      utterance.pitch = options.pitch;
    }

    if (options.rate) {
      utterance.rate = options.rate;
    }

    if (options.volume !== undefined) {
      utterance.volume = options.volume;
    }

    if (options.voice) {
      utterance.voice = options.voice;
    }

    window.speechSynthesis.speak(utterance);
    return utterance;
  }, [canSpeak]);

  useEffect(() => () => {
    stopListening();
    if (canSpeak) {
      window.speechSynthesis.cancel();
    }
  }, [stopListening, canSpeak]);

  return {
    canListen,
    canSpeak,
    isListening,
    lastTranscript,
    resetTranscript,
    speak,
    startListening,
    stopListening,
  };
};

export default useVoiceChat;
