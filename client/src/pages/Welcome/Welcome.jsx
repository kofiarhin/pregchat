import React from "react";
import { Link } from "react-router-dom";
import { useCurrentUserQuery } from "../../features/auth/hooks/useAuth.js";
import { useOnboardingQuery } from "../../features/onboarding/hooks/useOnboarding.js";
import { useTodayPregnancyQuery } from "../../features/pregnancy/hooks/usePregnancy.js";
import "./welcome.styles.scss";

const frequencyLabels = {
  daily: "Daily",
  few_times_week: "A few times a week",
  weekly: "Weekly",
};

const genderLabels = {
  female: "Female",
  male: "Male",
  unknown: "Unknown",
};

const Welcome = () => {
  const { data: currentUser } = useCurrentUserQuery();
  const {
    data: onboardingData,
    isLoading: onboardingLoading,
    error: onboardingError,
  } = useOnboardingQuery();
  const {
    data: todayData,
    isLoading: todayLoading,
    error: todayError,
  } = useTodayPregnancyQuery();

  const onboardingErrorMessage = onboardingError?.message;
  const hasOnboarding = Boolean(onboardingData);

  const babyGenderLabel = onboardingData?.babyGender
    ? genderLabels[onboardingData.babyGender] || "Unknown"
    : "Not provided";

  const healthConsiderations = onboardingData?.healthConsiderations?.trim()
    ? onboardingData.healthConsiderations.trim()
    : "None provided";

  const frequencyLabel = onboardingData?.updateFrequency
    ? frequencyLabels[onboardingData.updateFrequency] || onboardingData.updateFrequency
    : "Not set";

  const isFirstPregnancyLabel = onboardingData?.isFirstPregnancy
    ? "Yes"
    : onboardingData?.isFirstPregnancy === false
    ? "No"
    : "Not set";

  return (
    <div className="welcome_page">
      <div className="welcome_card">
        <h1 className="welcome_heading">Welcome to PregChat!</h1>
        <p className="welcome_subheading">Your Pregnancy Wellness Guide</p>

        {currentUser && (
          <div className="welcome_intro">
            <p>Hi {currentUser.name}! I'm Aya, your pregnancy guide.</p>
            <p>Ask me anything about your pregnancy wellness journey.</p>
          </div>
        )}

        {todayLoading ? (
          <div className="welcome_loading">
            <div className="loading" />
          </div>
        ) : todayData ? (
          <div className="welcome_section">
            <h3>Today's update</h3>
            <p>
              <strong>Day {todayData.day}</strong>
            </p>
            <p>{todayData.babyUpdate}</p>
            <p>{todayData.momUpdate}</p>
            <p style={{ fontStyle: "italic", color: "#b5c2ff" }}>{todayData.tips}</p>
          </div>
        ) : (
          <div className="welcome_callout">
            <h3>Getting started</h3>
            <p>
              {todayError?.message ||
                "Complete your onboarding to unlock daily pregnancy insights."}
            </p>
          </div>
        )}

        {onboardingLoading ? (
          <div className="welcome_loading">Loading your onboarding details...</div>
        ) : onboardingErrorMessage ? (
          <div className="welcome_error">{onboardingErrorMessage}</div>
        ) : hasOnboarding ? (
          <div className="welcome_section">
            <h3>Your pregnancy profile</h3>
            <div className="welcome_details">
              <div className="welcome_detail_item">
                <span className="welcome_detail_label">Due date or week</span>
                <span className="welcome_detail_value">
                  {onboardingData.dueDateOrPregnancyWeek}
                </span>
              </div>
              <div className="welcome_detail_item">
                <span className="welcome_detail_label">Baby's gender</span>
                <span className="welcome_detail_value">{babyGenderLabel}</span>
              </div>
              <div className="welcome_detail_item">
                <span className="welcome_detail_label">Health considerations</span>
                <span className="welcome_detail_value">{healthConsiderations}</span>
              </div>
              <div className="welcome_detail_item">
                <span className="welcome_detail_label">Update frequency</span>
                <span className="welcome_detail_value">{frequencyLabel}</span>
              </div>
              <div className="welcome_detail_item">
                <span className="welcome_detail_label">First pregnancy</span>
                <span className="welcome_detail_value">{isFirstPregnancyLabel}</span>
              </div>
            </div>
            <Link className="welcome_link" to="/onboarding">
              Update onboarding
            </Link>
          </div>
        ) : (
          <div className="welcome_callout">
            <h3>Complete your onboarding</h3>
            <p>
              We need a few details about your pregnancy so we can tailor PregChat
              to you.
            </p>
            <Link className="welcome_link" to="/onboarding">
              Complete onboarding
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Welcome;
