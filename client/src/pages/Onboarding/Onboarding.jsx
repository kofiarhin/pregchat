import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useOnboardingQuery } from "../../features/onboarding/hooks/useOnboarding.js";
import { useSaveOnboardingMutation } from "../../features/onboarding/hooks/useOnboarding.js";
import { useUpdatePregnancyProfileMutation } from "../../features/pregnancy/hooks/usePregnancy.js";
import { pregnancyKeys } from "../../features/pregnancy/queryKeys.js";
import "./onboarding.styles.scss";

const initialValues = {
  dueDateOrPregnancyWeek: "",
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!onboardingData) {
      return;
    }

    setFormValues({
      dueDateOrPregnancyWeek: onboardingData.dueDateOrPregnancyWeek || "",
      babyGender: onboardingData.babyGender || "",
      healthConsiderations: onboardingData.healthConsiderations || "",
      updateFrequency: onboardingData.updateFrequency || "",
      isFirstPregnancy:
        typeof onboardingData.isFirstPregnancy === "boolean"
          ? String(onboardingData.isFirstPregnancy)
          : "",
    });
  }, [onboardingData]);

  const frequencyOptions = useMemo(
    () => [
      { value: "", label: "Select an update cadence" },
      { value: "daily", label: "Daily" },
      { value: "few_times_week", label: "A few times a week" },
      { value: "weekly", label: "Weekly" },
    ],
    []
  );

  const genderOptions = useMemo(
    () => [
      { value: "", label: "Prefer not to say" },
      { value: "female", label: "Female" },
      { value: "male", label: "Male" },
      { value: "unknown", label: "Unknown" },
    ],
    []
  );

  const parsePregnancyInput = (rawInput) => {
    if (typeof rawInput !== "string") {
      return null;
    }

    const value = rawInput.trim();
    if (!value) {
      return null;
    }

    const weeksMatch = value
      .toLowerCase()
      .match(
        /^(\d{1,2})\s*(?:weeks?|w)(?:\s*(?:and)?\s*(\d)\s*(?:days?|d))?$/
      );

    if (weeksMatch) {
      const weeks = Number.parseInt(weeksMatch[1], 10);
      const days = weeksMatch[2] ? Number.parseInt(weeksMatch[2], 10) : 0;

      if (
        !Number.isInteger(weeks) ||
        weeks < 0 ||
        weeks > 42 ||
        !Number.isInteger(days) ||
        days < 0 ||
        days > 6
      ) {
        return null;
      }

      const totalDays = weeks * 7 + days;
      if (totalDays > 280) {
        return null;
      }

      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const lmpDate = new Date(today);
      lmpDate.setDate(today.getDate() - totalDays);

      return { payload: { lmpDate: lmpDate.toISOString() } };
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      const dueDate = new Date(parsedDate);
      dueDate.setHours(12, 0, 0, 0);
      return { payload: { dueDate: dueDate.toISOString() } };
    }

    return null;
  };

  const validate = () => {
    const errors = {};
    let parsedPregnancy = null;

    if (!formValues.dueDateOrPregnancyWeek.trim()) {
      errors.dueDateOrPregnancyWeek = "This field is required.";
    } else {
      parsedPregnancy = parsePregnancyInput(formValues.dueDateOrPregnancyWeek);
      if (!parsedPregnancy) {
        errors.dueDateOrPregnancyWeek =
          "Enter a due date or pregnancy week (e.g. \"12 March 2025\" or \"18 weeks\").";
      }
    }

    if (!formValues.updateFrequency) {
      errors.updateFrequency = "Select how often you'd like updates.";
    }

    if (formValues.isFirstPregnancy === "") {
      errors.isFirstPregnancy = "Please let us know if this is your first pregnancy.";
    }

    return { errors, parsedPregnancy };
  };

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const { errors, parsedPregnancy } = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await saveOnboarding({
        dueDateOrPregnancyWeek: formValues.dueDateOrPregnancyWeek.trim(),
        babyGender: formValues.babyGender || null,
        healthConsiderations: formValues.healthConsiderations.trim(),
        updateFrequency: formValues.updateFrequency,
        isFirstPregnancy: formValues.isFirstPregnancy === "true",
      });

      if (parsedPregnancy?.payload) {
        await updatePregnancyProfile(parsedPregnancy.payload);
        await queryClient.invalidateQueries({
          queryKey: pregnancyKeys.today(),
        });
      }

      navigate("/profile");
    } catch (error) {
      setSubmitError(error.message);
    }
  };

  const globalError = submitError || mutationError?.message;

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

            <div className="onboarding_field">
              <label className="onboarding_label" htmlFor="dueDateOrPregnancyWeek">
                Estimated due date or current pregnancy week
              </label>
              <input
                id="dueDateOrPregnancyWeek"
                name="dueDateOrPregnancyWeek"
                type="text"
                className="onboarding_input"
                value={formValues.dueDateOrPregnancyWeek}
                onChange={handleFieldChange}
                placeholder="e.g. 12 March 2025 or 18 weeks"
                required
              />
              {fieldErrors.dueDateOrPregnancyWeek && (
                <span className="onboarding_error">
                  {fieldErrors.dueDateOrPregnancyWeek}
                </span>
              )}
            </div>

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
                {genderOptions.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="onboarding_field">
              <label className="onboarding_label" htmlFor="healthConsiderations">
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
                {frequencyOptions.map((option) => (
                  <option key={option.value || "placeholder"} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
                <label className="onboarding_radio_option" htmlFor="firstPregnancyYes">
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
                <label className="onboarding_radio_option" htmlFor="firstPregnancyNo">
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

            <button className="onboarding_submit" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save and continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
