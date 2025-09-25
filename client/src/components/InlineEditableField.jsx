import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateProfileField } from "../services/profile.js";
import styles from "./InlineEditableField.styles.module.scss";

const InlineEditableField = ({
  profileId,
  field,
  label,
  value,
  type = "text",
  options = [],
  parse = (nextValue) => nextValue,
  format = (currentValue) => currentValue,
  onSaved,
}) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [badgeVisible, setBadgeVisible] = useState(false);
  const inputRef = useRef(null);

  const hasValue =
    value !== null && value !== undefined && String(value).length > 0;

  const computeInitialValue = useCallback(() => {
    if (type === "date") {
      if (!value) {
        return "";
      }

      if (typeof value === "string" && value.length >= 10) {
        return value.slice(0, 10);
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "";
      }

      return date.toISOString().slice(0, 10);
    }

    if (type === "number") {
      if (value === null || value === undefined || value === "") {
        return "";
      }

      return String(value);
    }

    if (type === "select") {
      if (value) {
        return String(value);
      }

      if (options.length > 0) {
        return String(options[0].value);
      }

      return "";
    }

    if (value === null || value === undefined) {
      return "";
    }

    return String(value);
  }, [options, type, value]);

  useEffect(() => {
    if (!editing) {
      setInputValue(computeInitialValue());
      setError("");
    }
  }, [computeInitialValue, editing]);

  useEffect(() => {
    if (!editing) {
      return;
    }

    if (inputRef.current) {
      inputRef.current.focus();
      if (type !== "select" && typeof inputRef.current.select === "function") {
        inputRef.current.select();
      }
    }
  }, [editing, type]);

  const displayValue = useMemo(() => {
    if (!hasValue) {
      return "Not set";
    }

    try {
      const formatted = format(value);
      if (
        formatted === null ||
        formatted === undefined ||
        formatted === ""
      ) {
        return "Not set";
      }

      return formatted;
    } catch (displayError) {
      console.error("Failed to format field", field, displayError);
      return String(value);
    }
  }, [field, format, hasValue, value]);

  const mutation = useMutation({
    mutationFn: async (nextValue) => {
      return updateProfileField(profileId, { [field]: nextValue });
    },
    onMutate: async (nextValue) => {
      setError("");
      setBadgeVisible(false);
      const previousValue = value;
      if (onSaved) {
        onSaved(nextValue);
      }
      return { previousValue };
    },
    onError: (mutationError, _newValue, context) => {
      if (onSaved && context && "previousValue" in context) {
        onSaved(context.previousValue);
      }
      setError(mutationError?.message || "Unable to save changes.");
    },
    onSuccess: (response, optimisticValue) => {
      if (onSaved && response && field in response) {
        onSaved(response[field]);
      } else if (onSaved) {
        onSaved(optimisticValue);
      }
      setEditing(false);
      setBadgeVisible(true);
    },
  });

  useEffect(() => {
    if (!badgeVisible) {
      return undefined;
    }

    const timeout = setTimeout(() => setBadgeVisible(false), 2000);
    return () => clearTimeout(timeout);
  }, [badgeVisible]);

  const handleStartEdit = () => {
    setEditing(true);
    setError("");
    setInputValue(computeInitialValue());
    mutation.reset();
  };

  const handleCancel = () => {
    if (mutation.isPending) {
      return;
    }

    setEditing(false);
    setError("");
    setInputValue(computeInitialValue());
    mutation.reset();
  };

  const parseNumber = (raw) => {
    if (raw === "" || raw === null || raw === undefined) {
      setError("Enter a value of 0 or greater.");
      return null;
    }

    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setError("Enter a valid number.");
      return null;
    }

    return Math.max(0, parsed);
  };

  const parseDate = (raw) => {
    if (!raw) {
      setError("Select a valid date.");
      return null;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      setError("Select a valid date.");
      return null;
    }

    return parsed.toISOString();
  };

  const handleSave = () => {
    if (mutation.isPending) {
      return;
    }

    if (!profileId) {
      setError("Missing profile identifier.");
      return;
    }

    let nextValue = inputValue;

    if (type === "number") {
      const parsedNumber = parseNumber(nextValue);
      if (parsedNumber === null) {
        return;
      }
      nextValue = parsedNumber;
    } else if (type === "date") {
      const parsedDate = parseDate(nextValue);
      if (!parsedDate) {
        return;
      }
      nextValue = parsedDate;
    }

    if (type === "text") {
      nextValue = typeof nextValue === "string" ? nextValue.trim() : nextValue;
    }

    let finalValue;
    try {
      finalValue = parse(nextValue);
    } catch (parseError) {
      console.error("Failed to parse value", field, parseError);
      setError("Unable to prepare value for saving.");
      return;
    }

    mutation.mutate(finalValue);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && event.shiftKey === false) {
      event.preventDefault();
      handleSave();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    }
  };

  const renderEditor = () => {
    if (type === "select") {
      return (
        <select
          ref={inputRef}
          className={styles.input}
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          disabled={mutation.isPending}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    const inputType = type === "number" ? "number" : type === "date" ? "date" : "text";

    return (
      <input
        ref={inputRef}
        className={styles.input}
        type={inputType}
        value={inputValue}
        onChange={(event) => {
          setInputValue(event.target.value);
          setError("");
        }}
        onKeyDown={handleKeyDown}
        disabled={mutation.isPending}
        min={type === "number" ? 0 : undefined}
      />
    );
  };

  return (
    <div className={styles.row}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>
        {editing ? (
          <>
            {renderEditor()}
            {error && <p className={styles.error}>{error}</p>}
          </>
        ) : (
          <>
            <span>{displayValue}</span>
            {badgeVisible && <span className={styles.badge}>Saved</span>}
          </>
        )}
      </div>
      <div className={styles.actions}>
        {editing ? (
          <>
            <button
              type="button"
              className={styles.save}
              onClick={handleSave}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className={styles.cancel}
              onClick={handleCancel}
              disabled={mutation.isPending}
            >
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className={styles.edit} onClick={handleStartEdit}>
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default InlineEditableField;
