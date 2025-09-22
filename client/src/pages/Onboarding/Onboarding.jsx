import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyOnboarding, useSaveOnboarding } from "../../hooks/useOnboarding";
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
  const { data: onboardingData, isLoading: onboardingLoading } = useMyOnboarding();
  const {
    mutateAsync: saveOnboarding,
    isPending: saving,
    error: mutationError,
  } = useSaveOnboarding();
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

  const validate = () => {
    const errors = {};

    if (!formValues.dueDateOrPregnancyWeek.trim()) {
      errors.dueDateOrPregnancyWeek = "This field is required.";
    }

    if (!formValues.updateFrequency) {
      errors.updateFrequency = "Select how often you'd like updates.";
    }

    if (formValues.isFirstPregnancy === "") {
      errors.isFirstPregnancy = "Please let us know if this is your first pregnancy.";
    }

    return errors;
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

    const errors = validate();
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

      navigate("/welcome");
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
            Share a few details to personalize your PregChat experience.
          </p>
        </div>
        {onboardingLoading ? (
          <div className="onboarding_loading">Loading your details…</div>
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
