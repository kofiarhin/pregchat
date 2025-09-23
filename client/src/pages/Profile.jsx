import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserQuery } from "../features/auth/hooks/useAuth.js";
import { authKeys } from "../features/auth/queryKeys.js";
import { saveStoredUser } from "../features/auth/storage.js";
import { useOnboardingQuery } from "../features/onboarding/hooks/useOnboarding.js";
import {
  useTodayPregnancyQuery,
  useUpdatePregnancyProfileMutation,
} from "../features/pregnancy/hooks/usePregnancy.js";
import "./profile.styles.scss";

const frequencyLabels = {
  daily: "Daily updates",
  few_times_week: "Updates a few times a week",
  weekly: "Weekly updates",
};

const genderLabels = {
  female: "Expecting a girl",
  male: "Expecting a boy",
  unknown: "Baby's gender unknown",
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const computeWeeksDays = (day) => {
  if (typeof day !== "number" || Number.isNaN(day) || day < 0) {
    return { weeks: null, days: null };
  }

  const weeks = Math.floor(day / 7);
  const days = day % 7;

  return { weeks, days };
};

const computeDueDateFromDay = (day) => {
  if (typeof day !== "number" || Number.isNaN(day) || day < 0) {
    return null;
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const dueDate = new Date(today);
  const remaining = Math.max(0, 280 - day);
  dueDate.setDate(today.getDate() + remaining);
  return dueDate;
};

const toLmpIsoString = (weeks, days) => {
  const totalDays = weeks * 7 + days;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const lmpDate = new Date(today);
  lmpDate.setDate(today.getDate() - totalDays);
  return lmpDate.toISOString();
};

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formSectionId = useId();
  const nameInputRef = useRef(null);

  const { data: currentUser } = useCurrentUserQuery();
  const { data: onboardingData } = useOnboardingQuery({ retry: 0 });
  const {
    data: todayData,
    isLoading: todayLoading,
    error: todayError,
    refetch: refetchToday,
  } = useTodayPregnancyQuery({ retry: 0 });

  const {
    mutateAsync: updatePregnancyProfile,
    isPending: savingProfile,
  } = useUpdatePregnancyProfileMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    weeks: "",
    days: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [lastDueDate, setLastDueDate] = useState(null);

  const profileExists = useMemo(
    () => typeof todayData?.day === "number" && !Number.isNaN(todayData.day),
    [todayData]
  );

  const profileNotFound = todayError?.status === 404;

  const { weeks: summaryWeeks, days: summaryDays } = useMemo(() => {
    if (!profileExists) {
      return { weeks: null, days: null };
    }

    return computeWeeksDays(todayData.day);
  }, [profileExists, todayData]);

  const dueDate = useMemo(() => {
    if (lastDueDate) {
      return new Date(lastDueDate);
    }

    if (profileExists) {
      return computeDueDateFromDay(todayData.day);
    }

    return null;
  }, [lastDueDate, profileExists, todayData]);

  useEffect(() => {
    if (!formOpen) {
      return;
    }

    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [formOpen]);

  const preferenceItems = useMemo(() => {
    if (!onboardingData) {
      return [];
    }

    const items = [];

    if (onboardingData.updateFrequency) {
      const label =
        frequencyLabels[onboardingData.updateFrequency] ??
        onboardingData.updateFrequency;
      items.push(label);
    }

    if (onboardingData.babyGender) {
      const label =
        genderLabels[onboardingData.babyGender] ?? "Baby's gender not set";
      items.push(label);
    }

    if (onboardingData.healthConsiderations?.trim()) {
      items.push(`Health: ${onboardingData.healthConsiderations.trim()}`);
    }

    if (typeof onboardingData.isFirstPregnancy === "boolean") {
      items.push(
        onboardingData.isFirstPregnancy
          ? "First pregnancy"
          : "Not the first pregnancy"
      );
    }

    return items;
  }, [onboardingData]);

  const openForm = useCallback(() => {
    const { weeks, days } = computeWeeksDays(todayData?.day ?? 0);

    setFormValues({
      name: currentUser?.name ?? "",
      weeks: typeof weeks === "number" ? String(weeks) : "",
      days: typeof days === "number" ? String(days) : "",
    });
    setFieldErrors({});
    setServerError("");
    setStatusMessage("");
    setFormOpen(true);
  }, [currentUser, todayData]);

  const handleCompleteProfile = () => {
    openForm();
  };

  const handleEditField = (event) => {
    event.preventDefault();
    openForm();
  };

  const handlePreferencesEdit = (event) => {
    event.preventDefault();
    navigate("/onboarding");
  };

  const handleExplore = () => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem("pregchat:explore", "1");
      }
    } catch (error) {
      console.error("Failed to persist explore preference", error);
    }

    navigate("/dashboard");
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
    setServerError("");
    setStatusMessage("");
  };

  const validate = () => {
    const errors = {};
    const trimmedName = formValues.name.trim();
    const weeksValue = Number.parseInt(formValues.weeks, 10);
    const daysValue = Number.parseInt(formValues.days, 10);

    if (!trimmedName) {
      errors.name = "Name is required.";
    }

    if (!Number.isInteger(weeksValue) || weeksValue < 0 || weeksValue > 42) {
      errors.weeks = "Enter weeks between 0 and 42.";
    }

    if (!Number.isInteger(daysValue) || daysValue < 0 || daysValue > 6) {
      errors.days = "Enter days between 0 and 6.";
    }

    if (errors.weeks === undefined && errors.days === undefined) {
      const totalDays = weeksValue * 7 + daysValue;
      if (totalDays > 280) {
        errors.days = "Gestational age cannot exceed 40 weeks.";
      }
    }

    return { errors, weeksValue, daysValue, trimmedName };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    setStatusMessage("");

    const { errors, weeksValue, daysValue, trimmedName } = validate();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const updatedUser = queryClient.setQueryData(
        authKeys.user(),
        (existingUser) => {
          if (!existingUser) {
            return existingUser;
          }

          if (trimmedName === existingUser.name) {
            return existingUser;
          }

          const nextUser = {
            ...existingUser,
            name: trimmedName,
          };
          saveStoredUser(nextUser);
          return nextUser;
        }
      );

      if (updatedUser && updatedUser.name !== trimmedName) {
        saveStoredUser({ ...updatedUser, name: trimmedName });
      }

      const lmpIso = toLmpIsoString(weeksValue, daysValue);
      const response = await updatePregnancyProfile({ lmpDate: lmpIso });
      if (response?.dueDate) {
        setLastDueDate(response.dueDate);
      }

      await refetchToday();

      setFieldErrors({});
      setFormOpen(false);
      setStatusMessage("Profile saved.");
    } catch (error) {
      setServerError(error?.message || "We couldn't save your profile.");
    }
  };

  const renderSummaryValue = (value) => {
    if (todayLoading && !profileExists && !profileNotFound) {
      return <span className="profile__muted">Loading…</span>;
    }

    if (value === null || value === undefined || value === "") {
      return <span className="profile__muted">Not set yet</span>;
    }

    return value;
  };

  const renderPreferencesValue = () => {
    if (preferenceItems.length === 0) {
      return <span className="profile__muted">Not set yet</span>;
    }

    return (
      <ul className="profile__preferences">
        {preferenceItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  };

  const footerYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <main className="profile" role="main">
      <div className="profile__container">
        <div className="profile__brand" tabIndex={0}>
          <span className="profile__logo" aria-hidden="true">
            <span className="profile__logo-mark">PC</span>
          </span>
          <span className="profile__brand-name">PregChat</span>
          <span className="profile__alpha">alpha</span>
        </div>

        <h1 className="profile__title">Your Pregnancy Profile</h1>

        {profileNotFound && (
          <p className="profile__intro">
            Let’s complete your profile so we can send daily insights.
          </p>
        )}

        {!profileNotFound && todayError && !todayLoading && (
          <p className="profile__error" role="alert">
            {todayError.message}
          </p>
        )}

        <section className="profile__summary" aria-live="polite">
          <div className="profile__field">
            <div className="profile__field-label">Name</div>
            <div className="profile__field-content">
              <span>{renderSummaryValue(currentUser?.name)}</span>
              <button
                type="button"
                className="profile__edit"
                onClick={handleEditField}
              >
                Edit
              </button>
            </div>
          </div>
          <div className="profile__field">
            <div className="profile__field-label">Weeks</div>
            <div className="profile__field-content">
              <span>
                {summaryWeeks != null
                  ? `${summaryWeeks} week${summaryWeeks === 1 ? "" : "s"}`
                  : renderSummaryValue(null)}
              </span>
              <button
                type="button"
                className="profile__edit"
                onClick={handleEditField}
              >
                Edit
              </button>
            </div>
          </div>
          <div className="profile__field">
            <div className="profile__field-label">Days</div>
            <div className="profile__field-content">
              <span>
                {summaryDays != null
                  ? `${summaryDays} day${summaryDays === 1 ? "" : "s"}`
                  : renderSummaryValue(null)}
              </span>
              <button
                type="button"
                className="profile__edit"
                onClick={handleEditField}
              >
                Edit
              </button>
            </div>
          </div>
          <div className="profile__field">
            <div className="profile__field-label">Estimated due date</div>
            <div className="profile__field-content">
              <span>
                {dueDate
                  ? formatDate(dueDate)
                  : renderSummaryValue(null)}
              </span>
              <button
                type="button"
                className="profile__edit"
                onClick={handleEditField}
              >
                Edit
              </button>
            </div>
          </div>
          <div className="profile__field">
            <div className="profile__field-label">Preferences</div>
            <div className="profile__field-content">
              {renderPreferencesValue()}
              <button
                type="button"
                className="profile__edit"
                onClick={handlePreferencesEdit}
              >
                Edit
              </button>
            </div>
          </div>
        </section>

        <button
          type="button"
          className="profile__cta"
          onClick={handleCompleteProfile}
          aria-expanded={formOpen}
          aria-controls={formSectionId}
          disabled={savingProfile}
        >
          Complete Profile
        </button>

        <div
          id={formSectionId}
          className={`profile__form${formOpen ? " profile__form--open" : ""}`}
          aria-hidden={!formOpen}
        >
          <div className="profile__form-inner">
            <div className="profile__form-header">
              <h2>Edit profile</h2>
              <p className="profile__muted">Takes ~20s. You can edit anytime.</p>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="profile__form-field">
                <label htmlFor="profile-name">Name</label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  ref={nameInputRef}
                  value={formValues.name}
                  onChange={handleFieldChange}
                  autoComplete="name"
                />
                {fieldErrors.name && (
                  <p className="profile__field-error">{fieldErrors.name}</p>
                )}
              </div>
              <div className="profile__form-grid">
                <div className="profile__form-field">
                  <label htmlFor="profile-weeks">Weeks</label>
                  <input
                    id="profile-weeks"
                    name="weeks"
                    type="number"
                    min="0"
                    max="42"
                    value={formValues.weeks}
                    onChange={handleFieldChange}
                    inputMode="numeric"
                  />
                  {fieldErrors.weeks && (
                    <p className="profile__field-error">{fieldErrors.weeks}</p>
                  )}
                </div>
                <div className="profile__form-field">
                  <label htmlFor="profile-days">Days</label>
                  <input
                    id="profile-days"
                    name="days"
                    type="number"
                    min="0"
                    max="6"
                    value={formValues.days}
                    onChange={handleFieldChange}
                    inputMode="numeric"
                  />
                  {fieldErrors.days && (
                    <p className="profile__field-error">{fieldErrors.days}</p>
                  )}
                </div>
              </div>

              {(serverError || statusMessage) && (
                <div className="profile__status" aria-live="polite">
                  {serverError ? (
                    <p className="profile__field-error">{serverError}</p>
                  ) : (
                    <p className="profile__status-message">{statusMessage}</p>
                  )}
                </div>
              )}

              <div className="profile__form-actions">
                <button type="submit" className="profile__save" disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  className="profile__cancel"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <ul className="profile__teaser">
          <li>Daily growth updates</li>
          <li>Wellness tips</li>
          <li>Doctor-ready logs</li>
        </ul>

        <button
          type="button"
          className="profile__secondary"
          onClick={handleExplore}
        >
          Explore without profile
        </button>

        <footer className="profile__footer">
          <a href="/terms">Terms</a>
          <span aria-hidden="true">&bull;</span>
          <a href="/privacy">Privacy</a>
          <span aria-hidden="true">&bull;</span>
          <span>© {footerYear}</span>
        </footer>
      </div>
    </main>
  );
};

export default Profile;
