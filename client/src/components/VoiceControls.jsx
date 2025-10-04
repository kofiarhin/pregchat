import React, { useMemo } from "react";
import { FiMic, FiMicOff, FiPlay, FiSquare } from "react-icons/fi";
import useVoice from "../hooks/useVoice.js";
import styles from "./voiceControls.styles.scss?inline";

const VoiceControls = ({ onSend }) => {
  const {
    supported,
    isListening,
    transcript,
    interim,
    start,
    stop,
    speak,
    cancelSpeech,
    setTranscript,
  } = useVoice();

  const canUseStt = supported.stt;
  const canUseTts = supported.tts;

  const combinedTranscript = useMemo(() => {
    if (transcript && interim) {
      return `${transcript} ${interim}`.trim();
    }

    return (transcript || interim || "").trim();
  }, [transcript, interim]);

  const handleToggleRecording = () => {
    if (!canUseStt) {
      return;
    }

    if (isListening) {
      stop();
      return;
    }

    start();
  };

  const handleUseText = () => {
    const text = combinedTranscript;

    if (!text) {
      return;
    }

    if (typeof onSend === "function") {
      onSend(text);
    }

    setTranscript("");
    stop();
  };

  const handleTestSpeech = () => {
    if (!canUseTts) {
      return;
    }

    speak(
      "Hello from PregChat. Your assistant will read new replies aloud whenever they arrive.",
      {
        rate: 0.96,
        pitch: 1,
        volume: 1,
      },
    );
  };

  const micLabel = isListening ? "Stop voice input" : "Start voice input";

  return (
    <div className="voiceControls" aria-live="polite">
      <style>{styles}</style>
      <div className="buttons">
        <button
          type="button"
          className={`btn${isListening ? " recording" : ""}`}
          onClick={handleToggleRecording}
          disabled={!canUseStt}
          aria-pressed={isListening}
          title={micLabel}
        >
          {isListening ? <FiMicOff /> : <FiMic />}
          {isListening ? "Stop" : "Speak"}
        </button>

        <button
          type="button"
          className="btn"
          onClick={handleUseText}
          disabled={!combinedTranscript}
          title="Insert the captured text into the chat input"
        >
          Use Text
        </button>

        <button
          type="button"
          className="btn"
          onClick={handleTestSpeech}
          disabled={!canUseTts}
          title="Play a sample response using text-to-speech"
        >
          <FiPlay /> Test TTS
        </button>

        <button
          type="button"
          className="btn"
          onClick={cancelSpeech}
          disabled={!canUseTts}
          title="Stop any ongoing text-to-speech"
        >
          <FiSquare /> Stop TTS
        </button>
      </div>

      <div className="voiceText">
        <strong>You said</strong>
        <p>
          {transcript}
          {interim && <span className="interim">{interim}</span>}
          {!transcript && !interim && "Tap the mic to start speaking"}
        </p>
      </div>
    </div>
  );
};

export default VoiceControls;
