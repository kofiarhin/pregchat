import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useOnboardingQuery } from "../../features/onboarding/hooks/useOnboarding.js";
import { useSaveOnboardingMutation } from "../../features/onboarding/hooks/useOnboarding.js";
import { useUpdatePregnancyProfileMutation } from "../../features/pregnancy/hooks/usePregnancy.js";
import { pregnancyKeys } from "../../features/pregnancy/queryKeys.js";
import "./onboarding.styles.scss";

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const formatDateOnly = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateOnly = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const [yearString, monthString, dayString] = trimmed.split("-");
  const year = Number.parseInt(yearString, 10);
  const month = Number.parseInt(monthString, 10);
  const day = Number.parseInt(dayString, 10);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const parseTimeValue = (value) => {
  if (!value) {
    return { hours: 12, minutes: 0 };
  }

  if (!/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hoursString, minutesString] = value.split(":");
  const hours = Number.parseInt(hoursString, 10);
  const minutes = Number.parseInt(minutesString, 10);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return { hours, minutes };
};

const addDays = (date, amount) => new Date(date.getTime() + amount * MS_IN_DAY);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const calculateGestationalAge = (dueDate, todayStart) => {
  const daysUntilEDD = Math.floor(
    (dueDate.getTime() - todayStart.getTime()) / MS_IN_DAY
  );
  const gestationalDays = 280 - daysUntilEDD;
  const clampedDays = clamp(gestationalDays, 0, 294);

  return {
    weeks: Math.floor(clampedDays / 7),
    days: clampedDays % 7,
    daysUntilEDD,
  };
};

const getDefaultPregnancyState = () => ({
  method: "dueDate",
  dueDate: { date: "", time: "12:00" },
  weeksDays: { weeks: "", days: "" },
  lmp: { date: "", cycleLength: "28" },
});

const parseStoredPregnancyValue = (value) => {
  const defaults = getDefaultPregnancyState();

  if (typeof value !== "string") {
    return defaults;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return defaults;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return {
      ...defaults,
      method: "dueDate",
      dueDate: { date: trimmed, time: "12:00" },
    };
  }

  const weeksMatch = trimmed.match(
    /(\d{1,2})\s*(?:weeks?|w)(?:\s*(?:and)?\s*(\d)\s*(?:days?|d))?/i
  );
  if (weeksMatch) {
    return {
      ...defaults,
      method: "weeksDays",
      weeksDays: {
        weeks: weeksMatch[1],
        days: weeksMatch[2] ? weeksMatch[2] : "0",
      },
    };
  }

  const lmpMatch = trimmed.match(/lmp[:\s]*(\d{4}-\d{2}-\d{2})/i);
  if (lmpMatch) {
    return {
      ...defaults,
      method: "lmp",
      lmp: { date: lmpMatch[1], cycleLength: "28" },
    };
  }

  const parsedDate = new Date(trimmed);
  if (!Number.isNaN(parsedDate.getTime())) {
    const normalized = formatDateOnly(
      new Date(
        Date.UTC(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate(),
          12,
          0,
          0,
          0
        )
      )
    );

    return {
      ...defaults,
      method: "dueDate",
      dueDate: { date: normalized, time: "12:00" },
    };
  }

  return defaults;
};

const evaluatePregnancySelection = (method, inputs, todayStart) => {
  const errors = {};
  if (method === "dueDate") {
    const dateValue = (inputs.dueDate?.date ?? "").trim();
    if (!dateValue) {
      errors.date = "Select your due date.";
      return { data: null, errors };
    }

    const parsedDate = parseDateOnly(dateValue);
    if (!parsedDate) {
      errors.date = "Enter a valid date.";
      return { data: null, errors };
    }

    const parsedTime = parseTimeValue(inputs.dueDate?.time);
    if (!parsedTime) {
      errors.time = "Enter a valid time.";
      return { data: null, errors };
    }

    const dueDateWithTime = new Date(parsedDate.getTime());
    dueDateWithTime.setUTCHours(parsedTime.hours, parsedTime.minutes, 0, 0);

    const age = calculateGestationalAge(dueDateWithTime, todayStart);

    if (age.daysUntilEDD < 0) {
      errors.date = "Due date must be today or later.";
      return { data: null, errors };
    }

    if (age.daysUntilEDD > 294) {
      errors.date = "Due date must be within the next 42 weeks.";
      return { data: null, errors };
    }

    const dueDateNormalized = new Date(parsedDate.getTime());
    dueDateNormalized.setUTCHours(12, 0, 0, 0);

    return {
      data: {
        dueDate: formatDateOnly(dueDateNormalized),
        weeks: age.weeks,
        days: age.days,
      },
      errors,
    };
  }

  if (method === "weeksDays") {
    const weeksValue = (inputs.weeksDays?.weeks ?? "").trim();
    const daysValue = (inputs.weeksDays?.days ?? "").trim();

    if (!weeksValue) {
      errors.weeks = "Enter weeks between 0 and 42.";
      return { data: null, errors };
    }

    const weeks = Number.parseInt(weeksValue, 10);
    if (!Number.isInteger(weeks) || weeks < 0 || weeks > 42) {
      errors.weeks = "Enter weeks between 0 and 42.";
      return { data: null, errors };
    }

    const hasDays = daysValue !== "";
    const days = hasDays ? Number.parseInt(daysValue, 10) : 0;

    if (
      (hasDays && (!Number.isInteger(days) || days < 0 || days > 6)) ||
      (!hasDays && days !== 0)
    ) {
      errors.days = "Days must be between 0 and 6.";
      return { data: null, errors };
    }

    const gestationalDays = weeks * 7 + days;
    if (gestationalDays > 294) {
      errors.days = "Gestational age must be 42 weeks or less.";
      return { data: null, errors };
    }

    const dueDate = addDays(todayStart, 280 - gestationalDays);
    dueDate.setUTCHours(12, 0, 0, 0);

    const age = calculateGestationalAge(dueDate, todayStart);

    return {
      data: {
        dueDate: formatDateOnly(dueDate),
        weeks: age.weeks,
        days: age.days,
      },
      errors,
    };
  }
  if (method === "lmp") {
    const lmpValue = (inputs.lmp?.date ?? "").trim();
    if (!lmpValue) {
      errors.lmpDate = "Select the first day of your last period.";
      return { data: null, errors };
    }

    const parsedLmp = parseDateOnly(lmpValue);
    if (!parsedLmp) {
      errors.lmpDate = "Enter a valid date.";
      return { data: null, errors };
    }

    const cycleValue = (inputs.lmp?.cycleLength ?? "").trim();
    let cycleLength = 28;

    if (cycleValue) {
      const parsedCycle = Number.parseInt(cycleValue, 10);
      if (
        !Number.isInteger(parsedCycle) ||
        parsedCycle < 21 ||
        parsedCycle > 35
      ) {
        errors.cycleLength = "Enter a cycle length between 21 and 35 days.";
        return { data: null, errors };
      }
      cycleLength = parsedCycle;
    }

    const daysSinceLmp = Math.floor(
      (todayStart.getTime() - parsedLmp.getTime()) / MS_IN_DAY
    );

    if (daysSinceLmp < 0) {
      errors.lmpDate = "LMP cannot be in the future.";
      return { data: null, errors };
    }

    if (daysSinceLmp > 304) {
      errors.lmpDate = "Enter an LMP within the last 10 months.";
      return { data: null, errors };
    }

    const cycleAdjustment = cycleLength - 28;
    const dueDate = addDays(parsedLmp, 280 + cycleAdjustment);
    dueDate.setUTCHours(12, 0, 0, 0);

    const age = calculateGestationalAge(dueDate, todayStart);

    if (age.daysUntilEDD < 0) {
      errors.lmpDate = "Calculated due date must be today or later.";
      return { data: null, errors };
    }

    if (age.daysUntilEDD > 294) {
      errors.lmpDate = "Calculated due date must be within the next 42 weeks.";
      return { data: null, errors };
    }

    const lmpNormalized = new Date(parsedLmp.getTime());
    lmpNormalized.setUTCHours(12, 0, 0, 0);

    return {
      data: {
        dueDate: formatDateOnly(dueDate),
        weeks: age.weeks,
        days: age.days,
        lmpDate: formatDateOnly(lmpNormalized),
      },
      errors,
    };
  }

  return {
    data: null,
    errors: { base: "Select how you'd like to provide your due date." },
  };
};

const initialValues = {
  babyGender: "",
  healthConsiderations: "",
  updateFrequency: "",
  isFirstPregnancy: "",
};

const Onboarding = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: onboardingData, isLoading: onboardingLoading } =
    useOnboardingQuery();
  const {
    mutateAsync: saveOnboarding,
    isPending: saving,
    error: mutationError,
  } = useSaveOnboardingMutation();
  const { mutateAsync: updatePregnancyProfile } =
    useUpdatePregnancyProfileMutation();

  const [formValues, setFormValues] = useState(initialValues);
  const [pregnancyMethod, setPregnancyMethod] = useState("dueDate");
  const [dueDateInputs, setDueDateInputs] = useState({
    date: "",
    time: "12:00",
  });
  const [weeksDaysInputs, setWeeksDaysInputs] = useState({
    weeks: "",
    days: "",
  });
  const [lmpInputs, setLmpInputs] = useState({
    date: "",
    cycleLength: "28",
  });
  const [pregnancyErrors, setPregnancyErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const todayStart = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

  const dueDateBounds = useMemo(
    () => ({
      min: formatDateOnly(addDays(todayStart, 0)),
      max: formatDateOnly(addDays(todayStart, 294)),
    }),
    [todayStart]
  );

  const lmpBounds = useMemo(
    () => ({
      min: formatDateOnly(addDays(todayStart, -304)),
      max: formatDateOnly(addDays(todayStart, 0)),
    }),
    [todayStart]
  );

  useEffect(() => {
    if (!onboardingData) {
      return;
    }

    setFormValues({
      babyGender: onboardingData.babyGender || "",
      healthConsiderations: onboardingData.healthConsiderations || "",
      updateFrequency: onboardingData.updateFrequency || "",
      isFirstPregnancy:
        typeof onboardingData.isFirstPregnancy === "boolean"
          ? String(onboardingData.isFirstPregnancy)
          : "",
    });

    const parsed = parseStoredPregnancyValue(
      onboardingData.dueDateOrPregnancyWeek
    );
    setPregnancyMethod(parsed.method);
    setDueDateInputs(parsed.dueDate);
    setWeeksDaysInputs(parsed.weeksDays);
    setLmpInputs(parsed.lmp);
    setPregnancyErrors({});
  }, [onboardingData]);
  const pregnancyEvaluation = useMemo(
    () =>
      evaluatePregnancySelection(
        pregnancyMethod,
        {
          dueDate: dueDateInputs,
          weeksDays: weeksDaysInputs,
          lmp: lmpInputs,
        },
        todayStart
      ),
    [pregnancyMethod, dueDateInputs, weeksDaysInputs, lmpInputs, todayStart]
  );

  const normalizedPregnancy = useMemo(() => {
    if (!pregnancyEvaluation.data) {
      return null;
    }
    if (Object.keys(pregnancyEvaluation.errors).length > 0) {
      return null;
    }
    return pregnancyEvaluation.data;
  }, [pregnancyEvaluation]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
    setSubmitError("");
  };

  const handleDueDateInputsChange = (event) => {
    const { name, value } = event.target;

    setDueDateInputs((current) => ({
      ...current,
      [name]: value,
    }));
    setPregnancyErrors({});
    setSubmitError("");
  };

  const handleWeeksDaysChange = (event) => {
    const { name, value } = event.target;

    setWeeksDaysInputs((current) => ({
      ...current,
      [name]: value,
    }));
    setPregnancyErrors({});
    setSubmitError("");
  };

  const handleLmpChange = (event) => {
    const { name, value } = event.target;

    setLmpInputs((current) => ({
      ...current,
      [name]: value,
    }));
    setPregnancyErrors({});
    setSubmitError("");
  };

  const handlePregnancyMethodChange = (method) => {
    setPregnancyMethod(method);
    setPregnancyErrors({});
    setSubmitError("");
  };
  const validate = () => {
    const evaluation = evaluatePregnancySelection(
      pregnancyMethod,
      {
        dueDate: dueDateInputs,
        weeksDays: weeksDaysInputs,
        lmp: lmpInputs,
      },
      todayStart
    );

    const errors = {};

    if (!formValues.updateFrequency) {
      errors.updateFrequency = "Select how often you'd like updates.";
    }

    if (formValues.isFirstPregnancy === "") {
      errors.isFirstPregnancy =
        "Please let us know if this is your first pregnancy.";
    }

    return {
      errors,
      pregnancyErrors: evaluation.errors,
      normalizedPregnancy:
        Object.keys(evaluation.errors).length === 0 ? evaluation.data : null,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const { errors, pregnancyErrors: pregnancyValidation, normalizedPregnancy } =
      validate();
    setFieldErrors(errors);
    setPregnancyErrors(pregnancyValidation);

    if (
      Object.keys(errors).length > 0 ||
      Object.keys(pregnancyValidation).length > 0 ||
      !normalizedPregnancy
    ) {
      return;
    }

    try {
      await saveOnboarding({
        dueDateOrPregnancyWeek: normalizedPregnancy.dueDate,
        babyGender: formValues.babyGender || null,
        healthConsiderations: formValues.healthConsiderations.trim(),
        updateFrequency: formValues.updateFrequency,
        isFirstPregnancy: formValues.isFirstPregnancy === "true",
      });

      const profilePayload = {
        dueDate: normalizedPregnancy.dueDate,
        weeks: normalizedPregnancy.weeks,
        days: normalizedPregnancy.days,
      };

      if (normalizedPregnancy.lmpDate) {
        profilePayload.lmpDate = normalizedPregnancy.lmpDate;
      }

      await updatePregnancyProfile(profilePayload);

      await queryClient.invalidateQueries({
        queryKey: pregnancyKeys.today(),
      });
      await queryClient.invalidateQueries({
        queryKey: pregnancyKeys.profile(),
      });
      await queryClient.invalidateQueries({
        queryKey: ["profile"],
      });

      navigate("/profile");
    } catch (error) {
      setSubmitError(error.message);
    }
  };

  const globalError = submitError || mutationError?.message;
  const previewText = normalizedPregnancy
    ? `${normalizedPregnancy.weeks} week${
        normalizedPregnancy.weeks === 1 ? "" : "s"
      } ${normalizedPregnancy.days} day${
        normalizedPregnancy.days === 1 ? "" : "s"
      }`
    : "—";
  const isSaveDisabled =
    saving ||
    !normalizedPregnancy ||
    !formValues.updateFrequency ||
    formValues.isFirstPregnancy === "";
  return (
    <div className="onboarding_page">
      <div className="onboarding_card">
        <div className="onboarding_header">
          <h1 className="onboarding_title">Complete your onboarding</h1>
          <p className="onboarding_subtitle">
            Share a few details so PregChat can personalise your experience.
          </p>
        </div>

        {onboardingLoading ? (
          <div className="onboarding_loading">
            <div className="loading" />
          </div>
        ) : (
          <form className="onboarding_form" onSubmit={handleSubmit} noValidate>
            {globalError && <div className="onboarding_alert">{globalError}</div>}

            <fieldset className="onboarding_field onboarding_fieldset">
              <legend className="onboarding_label">Estimated due date</legend>
              <div
                className="onboarding_toggle"
                role="radiogroup"
                aria-label="Estimated due date entry method"
              >
                <button
                  type="button"
                  className={`onboarding_toggle_button${
                    pregnancyMethod === "dueDate"
                      ? " onboarding_toggle_button--active"
                      : ""
                  }`}
                  onClick={() => handlePregnancyMethodChange("dueDate")}
                  aria-pressed={pregnancyMethod === "dueDate"}
                >
                  Due date
                </button>
                <button
                  type="button"
                  className={`onboarding_toggle_button${
                    pregnancyMethod === "weeksDays"
                      ? " onboarding_toggle_button--active"
                      : ""
                  }`}
                  onClick={() => handlePregnancyMethodChange("weeksDays")}
                  aria-pressed={pregnancyMethod === "weeksDays"}
                >
                  Weeks & days
                </button>
                <button
                  type="button"
                  className={`onboarding_toggle_button${
                    pregnancyMethod === "lmp"
                      ? " onboarding_toggle_button--active"
                      : ""
                  }`}
                  onClick={() => handlePregnancyMethodChange("lmp")}
                  aria-pressed={pregnancyMethod === "lmp"}
                >
                  LMP
                </button>
              </div>

              {pregnancyMethod === "dueDate" && (
                <div className="onboarding_segment">
                  <div className="onboarding_inputs_row">
                    <div className="onboarding_inline_field">
                      <label
                        className="onboarding_inline_label"
                        htmlFor="estimatedDueDateDate"
                      >
                        Date
                      </label>
                      <input
                        id="estimatedDueDateDate"
                        name="date"
                        type="date"
                        className="onboarding_input"
                        value={dueDateInputs.date}
                        min={dueDateBounds.min}
                        max={dueDateBounds.max}
                        onChange={handleDueDateInputsChange}
                        required
                      />
                      {pregnancyErrors.date && (
                        <span className="onboarding_error">
                          {pregnancyErrors.date}
                        </span>
                      )}
                    </div>
                    <div className="onboarding_inline_field onboarding_inline_field--compact">
                      <label
                        className="onboarding_inline_label"
                        htmlFor="estimatedDueDateTime"
                      >
                        Time (optional)
                      </label>
                      <input
                        id="estimatedDueDateTime"
                        name="time"
                        type="time"
                        className="onboarding_input"
                        value={dueDateInputs.time}
                        onChange={handleDueDateInputsChange}
                      />
                      {pregnancyErrors.time && (
                        <span className="onboarding_error">
                          {pregnancyErrors.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {pregnancyMethod === "weeksDays" && (
                <div className="onboarding_segment">
                  <div className="onboarding_inputs_row">
                    <div className="onboarding_inline_field">
                      <label
                        className="onboarding_inline_label"
                        htmlFor="gestationWeeks"
                      >
                        Weeks
                      </label>
                      <input
                        id="gestationWeeks"
                        name="weeks"
                        type="number"
                        min="0"
                        max="42"
                        className="onboarding_input"
                        value={weeksDaysInputs.weeks}
                        onChange={handleWeeksDaysChange}
                        inputMode="numeric"
                        required
                      />
                      {pregnancyErrors.weeks && (
                        <span className="onboarding_error">
                          {pregnancyErrors.weeks}
                        </span>
                      )}
                    </div>
                    <div className="onboarding_inline_field onboarding_inline_field--compact">
                      <label
                        className="onboarding_inline_label"
                        htmlFor="gestationDays"
                      >
                        Days
                      </label>
                      <input
                        id="gestationDays"
                        name="days"
                        type="number"
                        min="0"
                        max="6"
                        className="onboarding_input"
                        value={weeksDaysInputs.days}
                        onChange={handleWeeksDaysChange}
                        inputMode="numeric"
                      />
                      {pregnancyErrors.days && (
                        <span className="onboarding_error">
                          {pregnancyErrors.days}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {pregnancyMethod === "lmp" && (
                <div className="onboarding_segment">
                  <div className="onboarding_inputs_row">
                    <div className="onboarding_inline_field">
                      <label
                        className="onboarding_inline_label"
                        htmlFor="lmpDate"
                      >
                        Last period
                      </label>
                      <input
                        id="lmpDate"
                        name="date"
                        type="date"
                        className="onboarding_input"
                        value={lmpInputs.date}
                        min={lmpBounds.min}
                        max={lmpBounds.max}
                        onChange={handleLmpChange}
                        required
                      />
                      {pregnancyErrors.lmpDate && (
                        <span className="onboarding_error">
                          {pregnancyErrors.lmpDate}
                        </span>
                      )}
                    </div>
                    <div className="onboarding_inline_field onboarding_inline_field--compact">
                      <label
                        className="onboarding_inline_label"
                        htmlFor="cycleLength"
                      >
                        Cycle length (optional)
                      </label>
                      <input
                        id="cycleLength"
                        name="cycleLength"
                        type="number"
                        min="21"
                        max="35"
                        className="onboarding_input"
                        value={lmpInputs.cycleLength}
                        onChange={handleLmpChange}
                        inputMode="numeric"
                      />
                      {pregnancyErrors.cycleLength && (
                        <span className="onboarding_error">
                          {pregnancyErrors.cycleLength}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {pregnancyErrors.base && (
                <span className="onboarding_error">{pregnancyErrors.base}</span>
              )}

              <p className="onboarding_helper">
                Don't know your due date? Enter weeks & days or last period.
              </p>
              <p className="onboarding_preview" aria-live="polite">
                You are <strong>{previewText}</strong> today.
              </p>
            </fieldset>

            <div className="onboarding_field">
              <label className="onboarding_label" htmlFor="babyGender">
                Baby's gender (optional)
              </label>
              <select
                id="babyGender"
                name="babyGender"
                className="onboarding_select"
                value={formValues.babyGender}
                onChange={handleFieldChange}
              >
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div className="onboarding_field">
              <label
                className="onboarding_label"
                htmlFor="healthConsiderations"
              >
                Health considerations (optional)
              </label>
              <textarea
                id="healthConsiderations"
                name="healthConsiderations"
                className="onboarding_textarea"
                value={formValues.healthConsiderations}
                onChange={handleFieldChange}
                placeholder="Share any conditions, allergies, or preferences."
              />
            </div>

            <div className="onboarding_field">
              <label className="onboarding_label" htmlFor="updateFrequency">
                How often would you like pregnancy updates?
              </label>
              <select
                id="updateFrequency"
                name="updateFrequency"
                className="onboarding_select"
                value={formValues.updateFrequency}
                onChange={handleFieldChange}
                required
              >
                <option value="">Select an update cadence</option>
                <option value="daily">Daily</option>
                <option value="few_times_week">A few times a week</option>
                <option value="weekly">Weekly</option>
              </select>
              {fieldErrors.updateFrequency && (
                <span className="onboarding_error">
                  {fieldErrors.updateFrequency}
                </span>
              )}
            </div>

            <div className="onboarding_field">
              <span className="onboarding_label">
                Is this your first pregnancy?
              </span>
              <div className="onboarding_radio_group">
                <label
                  className="onboarding_radio_option"
                  htmlFor="firstPregnancyYes"
                >
                  <input
                    type="radio"
                    id="firstPregnancyYes"
                    name="isFirstPregnancy"
                    value="true"
                    checked={formValues.isFirstPregnancy === "true"}
                    onChange={handleFieldChange}
                  />
                  Yes
                </label>
                <label
                  className="onboarding_radio_option"
                  htmlFor="firstPregnancyNo"
                >
                  <input
                    type="radio"
                    id="firstPregnancyNo"
                    name="isFirstPregnancy"
                    value="false"
                    checked={formValues.isFirstPregnancy === "false"}
                    onChange={handleFieldChange}
                  />
                  No
                </label>
              </div>
              {fieldErrors.isFirstPregnancy && (
                <span className="onboarding_error">
                  {fieldErrors.isFirstPregnancy}
                </span>
              )}
            </div>

            <button
              className="onboarding_submit"
              type="submit"
              disabled={isSaveDisabled}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
