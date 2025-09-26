import { useCallback, useEffect, useRef, useState } from "react";

const getSpeechRecognition = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
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
  } = options;

  const recognitionRef = useRef(null);
  const optionsRef = useRef({
    autoSendOnFinal,
    onFinalTranscript,
    onError,
    onListenStart,
    onListenEnd,
  });
  const [supported, setSupported] = useState({ stt: false });
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
    };
  }, [autoSendOnFinal, onFinalTranscript, onError, onListenStart, onListenEnd]);

  useEffect(() => {
    const Recognition = getSpeechRecognition();
    setSupported({ stt: Boolean(Recognition) });

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

  const start = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      return;
    }

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
  }, [lang, interimResults, continuous]);

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
    },
    [stop],
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
    setTranscript,
  };
};

export default useVoice;
