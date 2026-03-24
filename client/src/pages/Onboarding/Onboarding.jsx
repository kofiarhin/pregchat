import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserQuery } from "../../features/auth/hooks/useAuth.js";
import content from "../../content/appContent.json";
import PregnancyDetailsForm from "../../components/PregnancyDetailsForm.jsx";
import UserDetailsForm from "../../components/UserDetailsForm.jsx";
import StepIndicator from "../../components/StepIndicator.jsx";
import { useUpdatePregnancyProfileMutation } from "../../features/pregnancy/hooks/usePregnancy.js";
import { authKeys } from "../../features/auth/queryKeys.js";
import { http } from "../../api/http.js";
import styles from "./onboarding.styles.module.scss";

const TOTAL_STEPS = 3;

const Onboarding = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUserQuery();
  const formCopy = content.forms?.pregnancyDetails ?? {};
  const steps = content.onboarding?.steps ?? {};

  const [step, setStep] = useState(0);
  const [savedDueDate, setSavedDueDate] = useState("");
  const [detailsSubmitting, setDetailsSubmitting] = useState(false);

  const updateMutation = useUpdatePregnancyProfileMutation({
    onSuccess: (data) => {
      setSavedDueDate(data?.dueDate ?? "");
      setStep(1);
    },
  });

  const handlePregnancySubmit = ({ mode, dueDate, lmpDate }) => {
    updateMutation.mutate({ mode, dueDate, lmpDate });
  };

  const submitDetails = async (payload) => {
    setDetailsSubmitting(true);
    try {
      await http.post("/api/onboarding/me", { json: payload });
      await queryClient.invalidateQueries({ queryKey: authKeys.user() });
      setStep(2);
    } finally {
      setDetailsSubmitting(false);
    }
  };

  const handleDetailsSubmit = (details) => {
    submitDetails({
      dueDateOrPregnancyWeek: savedDueDate || "provided",
      isFirstPregnancy: details.isFirstPregnancy,
      babyGender: details.babyGender,
      updateFrequency: details.updateFrequency,
      healthConsiderations: details.healthConsiderations,
    });
  };

  const handleSkip = () => {
    submitDetails({
      dueDateOrPregnancyWeek: savedDueDate || "skipped",
      isFirstPregnancy: true,
      updateFrequency: "daily",
    });
  };

  const handleFinish = () => {
    queryClient.invalidateQueries({ queryKey: authKeys.user() });
    navigate("/dashboard", { replace: true });
  };

  // Reverse guard: completed users should not re-visit onboarding
  if (currentUser?.onboardingCompletedAt) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

        {step === 0 && (
          <>
            <header className={styles.header}>
              <h1 className={styles.title}>
                {steps.pregnancy?.title || "When is your baby due?"}
              </h1>
              <p className={styles.subtitle}>
                {steps.pregnancy?.subtitle ||
                  "This helps us give you the right updates for your stage."}
              </p>
            </header>

            <PregnancyDetailsForm
              initialValues={{ mode: "dueDate", dueDate: "", lmpDate: "" }}
              content={formCopy}
              submitLabel={steps.pregnancy?.submit || "Continue"}
              onSubmit={handlePregnancySubmit}
              isSubmitting={updateMutation.isPending}
              dueDateInputType="date"
              lmpDateInputType="date"
            />
          </>
        )}

        {step === 1 && (
          <>
            <header className={styles.header}>
              <h1 className={styles.title}>
                {steps.details?.title || "A bit about you"}
              </h1>
              <p className={styles.subtitle}>
                {steps.details?.subtitle ||
                  "Optional — helps us personalise your experience."}
              </p>
            </header>
            <UserDetailsForm
              content={steps.details}
              onSubmit={handleDetailsSubmit}
              onSkip={handleSkip}
              isSubmitting={detailsSubmitting}
            />
          </>
        )}

        {step === 2 && (
          <div className={styles.completeStep}>
            <header className={styles.header}>
              <h1 className={styles.title}>
                {steps.complete?.title || "You're all set!"}
              </h1>
              <p className={styles.subtitle}>
                {steps.complete?.subtitle ||
                  "Your dashboard is ready with personalised updates."}
              </p>
            </header>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleFinish}
            >
              {steps.complete?.cta || "Go to my dashboard"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default Onboarding;
