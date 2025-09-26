import { useEffect, useMemo, useState } from "react";
import styles from "./pregnancyDetailsForm.styles.module.scss";

const PregnancyDetailsForm = ({
  initialValues,
  content,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const fallbackContent = content ?? {};
  const modes = fallbackContent.mode ?? {};
  const fieldCopy = fallbackContent.fields ?? {};
  const errorCopy = fallbackContent.errors ?? {};
  const buttonCopy = fallbackContent.buttons ?? {};
  const legendCopy = fallbackContent.legend || "Share your pregnancy timeline";
  const dueDateLabel = fieldCopy.dueDate?.label || "Estimated due date";
  const dueDateHelper =
    fieldCopy.dueDate?.helper || "Select the date your provider shared.";
  const lmpLabel = fieldCopy.lmpDate?.label || "Last menstrual period";
  const lmpHelper =
    fieldCopy.lmpDate?.helper || "Use the first day of your last cycle.";
  const dueModeLabel = modes.dueDate || "I know my due date";
  const lmpModeLabel = modes.lmp || "I know my LMP";
  const submitLabelCopy = buttonCopy.submit || "Save details";
  const cancelLabelCopy = buttonCopy.cancel || "Cancel";

  const defaultValues = useMemo(
    () => ({
      mode:
        initialValues?.mode ||
        (initialValues?.dueDate
          ? "dueDate"
          : initialValues?.lmpDate
          ? "lmp"
          : "dueDate"),
      dueDate: initialValues?.dueDate || "",
      lmpDate: initialValues?.lmpDate || "",
    }),
    [initialValues]
  );

  const [mode, setMode] = useState(defaultValues.mode);
  const [dueDate, setDueDate] = useState(defaultValues.dueDate);
  const [lmpDate, setLmpDate] = useState(defaultValues.lmpDate);
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(defaultValues.mode);
    setDueDate(defaultValues.dueDate);
    setLmpDate(defaultValues.lmpDate);
    setError("");
  }, [defaultValues]);

  const handleModeChange = (event) => {
    setMode(event.target.value);
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (mode === "dueDate" && !dueDate) {
    setError(errorCopy.dueDateRequired || "Please provide a due date.");
      return;
    }

    if (mode === "lmp" && !lmpDate) {
      setError(errorCopy.lmpDateRequired || "Please provide the LMP date.");
      return;
    }

    setError("");
    onSubmit?.({
      mode,
      dueDate: mode === "dueDate" ? dueDate : "",
      lmpDate: mode === "lmp" ? lmpDate : "",
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <fieldset className={styles.modeSelector}>
        <legend className={styles.legend}>{legendCopy}</legend>
        <label className={styles.modeOption}>
          <input
            type="radio"
            name="pregnancy-mode"
            value="dueDate"
            checked={mode === "dueDate"}
            onChange={handleModeChange}
          />
          <span>{dueModeLabel}</span>
        </label>
        <label className={styles.modeOption}>
          <input
            type="radio"
            name="pregnancy-mode"
            value="lmp"
            checked={mode === "lmp"}
            onChange={handleModeChange}
          />
          <span>{lmpModeLabel}</span>
        </label>
      </fieldset>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="dueDate">
          {dueDateLabel}
        </label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          className={styles.input}
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          disabled={mode !== "dueDate"}
          aria-describedby="dueDate-helper"
        />
        <p id="dueDate-helper" className={styles.helper}>
          {dueDateHelper}
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="lmpDate">
          {lmpLabel}
        </label>
        <input
          id="lmpDate"
          name="lmpDate"
          type="date"
          className={styles.input}
          value={lmpDate}
          onChange={(event) => setLmpDate(event.target.value)}
          disabled={mode !== "lmp"}
          aria-describedby="lmpDate-helper"
        />
        <p id="lmpDate-helper" className={styles.helper}>
          {lmpHelper}
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        {onCancel && (
          <button
            type="button"
            className={styles.secondary}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabelCopy}
          </button>
        )}
        <button type="submit" className={styles.primary} disabled={isSubmitting}>
          {submitLabel || submitLabelCopy}
        </button>
      </div>
    </form>
  );
};

export default PregnancyDetailsForm;
