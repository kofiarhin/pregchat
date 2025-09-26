import { useCallback, useEffect, useRef, useState } from "react";

const getSpeechRecognition = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const sanitizeNumber = (value, fallback, min = 0, max = 2) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

const useVoice = (options = {}) => {
  const {
    lang = "en-US",
    interimResults = true,
    continuous = false,
    autoSendOnFinal = false,
    onFinalTranscript,
    onError,
    onListenStart,
    onListenEnd,
    onSpeakStart,
    onSpeakEnd,
  } = options;

  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const optionsRef = useRef({
    autoSendOnFinal,
    onFinalTranscript,
    onError,
    onListenStart,
    onListenEnd,
    onSpeakStart,
    onSpeakEnd,
  });
  const [supported, setSupported] = useState({ stt: false, tts: false });
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscriptState] = useState("");
  const [interim, setInterim] = useState("");

  useEffect(() => {
    optionsRef.current = {
      autoSendOnFinal,
      onFinalTranscript,
      onError,
      onListenStart,
      onListenEnd,
      onSpeakStart,
      onSpeakEnd,
    };
  }, [
    autoSendOnFinal,
    onFinalTranscript,
    onError,
    onListenStart,
    onListenEnd,
    onSpeakStart,
    onSpeakEnd,
  ]);

  useEffect(() => {
    const Recognition = getSpeechRecognition();
    const isClient = typeof window !== "undefined";
    const hasTts = Boolean(isClient && window.speechSynthesis);

    setSupported({ stt: Boolean(Recognition), tts: hasTts });

    if (!Recognition) {
      recognitionRef.current = null;
      return () => {};
    }

    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.interimResults = interimResults;
    recognition.continuous = continuous;

    recognition.onstart = () => {
      setIsListening(true);
      const { onListenStart: handleListenStart } = optionsRef.current;
      if (typeof handleListenStart === "function") {
        handleListenStart();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterim("");
      const { onListenEnd: handleListenEnd } = optionsRef.current;
      if (typeof handleListenEnd === "function") {
        handleListenEnd();
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      const { onError: handleError, onListenEnd: handleListenEnd } =
        optionsRef.current;
      if (typeof handleError === "function") {
        handleError(event);
      }
      if (typeof handleListenEnd === "function") {
        handleListenEnd();
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript?.trim();

        if (!text) {
          continue;
        }

        if (result.isFinal) {
          finalTranscript = finalTranscript
            ? `${finalTranscript} ${text}`
            : text;
        } else {
          interimTranscript = interimTranscript
            ? `${interimTranscript} ${text}`
            : text;
        }
      }

      if (interimTranscript) {
        setInterim(interimTranscript);
      } else {
        setInterim("");
      }

      if (finalTranscript) {
        setTranscriptState((prev) => {
          if (!prev) {
            return finalTranscript;
          }

          return `${prev} ${finalTranscript}`.trim();
        });
        setInterim("");

        const { autoSendOnFinal: shouldAutoSend, onFinalTranscript: finalCb } =
          optionsRef.current;

        if (shouldAutoSend && typeof finalCb === "function") {
          finalCb(finalTranscript);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;

      try {
        recognition.stop();
      } catch (error) {
        // Ignore cleanup errors when recognition was never started.
      }

      recognitionRef.current = null;
    };
  }, [lang, interimResults, continuous]);

  const cancelSpeech = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const synth = window.speechSynthesis;

    if (!synth) {
      return;
    }

    synth.cancel();
    utteranceRef.current = null;
    const { onSpeakEnd: handleSpeakEnd } = optionsRef.current;
    if (typeof handleSpeakEnd === "function") {
      handleSpeakEnd();
    }
  }, []);

  const speak = useCallback(
    (text, speakOptions = {}) => {
      if (typeof window === "undefined") {
        return;
      }

      if (!supported.tts) {
        return;
      }

      const phrase = typeof text === "string" ? text.trim() : "";

      if (!phrase) {
        return;
      }

      const synth = window.speechSynthesis;

      if (!synth) {
        return;
      }

      const {
        rate = 1,
        pitch = 1,
        volume = 1,
        lang: speakLang,
      } = speakOptions;

      cancelSpeech();

      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = sanitizeNumber(rate, 1, 0.1, 2);
      utterance.pitch = sanitizeNumber(pitch, 1, 0, 2);
      utterance.volume = sanitizeNumber(volume, 1, 0, 1);
      utterance.lang = speakLang || lang;

      synth.speak(utterance);
      utteranceRef.current = utterance;
      const { onSpeakStart: handleSpeakStart, onSpeakEnd: handleSpeakEnd } =
        optionsRef.current;
      if (typeof handleSpeakStart === "function") {
        handleSpeakStart();
      }
      utterance.onend = () => {
        utteranceRef.current = null;
        if (typeof handleSpeakEnd === "function") {
          handleSpeakEnd();
        }
      };
      utterance.onerror = () => {
        utteranceRef.current = null;
        if (typeof handleSpeakEnd === "function") {
          handleSpeakEnd();
        }
      };
    },
    [cancelSpeech, lang, supported.tts],
  );

  const start = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      return;
    }

    cancelSpeech();
    setTranscriptState("");
    setInterim("");

    recognition.lang = lang;
    recognition.interimResults = interimResults;
    recognition.continuous = continuous;

    try {
      recognition.start();
    } catch (error) {
      const message = error?.message || "";
      if (!message.includes("start") && !message.includes("active")) {
        console.error(error);
      }
    }
  }, [cancelSpeech, lang, interimResults, continuous]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      return;
    }

    try {
      recognition.stop();
    } catch (error) {
      const message = error?.message || "";
      if (!message.includes("not active")) {
        console.error(error);
      }
    }
  }, []);

  useEffect(
    () => () => {
      try {
        stop();
      } catch (error) {
        // Ignore cleanup errors
      }
      cancelSpeech();
    },
    [stop, cancelSpeech],
  );

  const setTranscript = useCallback((value) => {
    setTranscriptState(value);
  }, []);

  return {
    supported,
    isListening,
    transcript,
    interim,
    start,
    stop,
    speak,
    cancelSpeech,
    setTranscript,
  };
};

export default useVoice;
