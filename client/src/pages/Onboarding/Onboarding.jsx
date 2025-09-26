import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import content from "../../content/appContent.json";
import PregnancyDetailsForm from "../../components/PregnancyDetailsForm.jsx";
import {
  usePregnancyProfileQuery,
  useUpdatePregnancyProfileMutation,
} from "../../features/pregnancy/hooks/usePregnancy.js";
import styles from "./onboarding.styles.module.scss";

const Onboarding = () => {
  const navigate = useNavigate();
  const pageCopy = content.onboarding?.page ?? {};
  const formCopy = content.forms?.pregnancyDetails ?? {};
  const { data: pregnancyProfile, isLoading } = usePregnancyProfileQuery();
  const [showSuccess, setShowSuccess] = useState(false);

  const updateMutation = useUpdatePregnancyProfileMutation({
    onSuccess: () => {
      setShowSuccess(true);
    },
  });

  useEffect(() => {
    if (pregnancyProfile && (pregnancyProfile.dueDate || pregnancyProfile.lmpDate)) {
      setShowSuccess(false);
    }
  }, [pregnancyProfile]);

  const handleSubmit = ({ mode, dueDate, lmpDate }) => {
    setShowSuccess(false);
    updateMutation.mutate({ mode, dueDate, lmpDate });
  };

  const initialValues = {
    dueDate: pregnancyProfile?.dueDate
      ? pregnancyProfile.dueDate.slice(0, 10)
      : "",
    lmpDate: pregnancyProfile?.lmpDate
      ? pregnancyProfile.lmpDate.slice(0, 10)
      : "",
    mode:
      pregnancyProfile?.dueDate
        ? "dueDate"
        : pregnancyProfile?.lmpDate
        ? "lmp"
        : "dueDate",
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>{pageCopy.title}</h1>
          <p className={styles.subtitle}>{pageCopy.description}</p>
        </header>

        {isLoading ? (
          <p className={styles.muted}>Loading...</p>
        ) : (
          <>
            <PregnancyDetailsForm
              initialValues={initialValues}
              content={formCopy}
              submitLabel={pageCopy.submit}
              onSubmit={handleSubmit}
              isSubmitting={updateMutation.isPending}
            />
            {showSuccess && (
              <div className={styles.success}>
                <p>{pageCopy.success}</p>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => navigate("/dashboard")}
                >
                  {pageCopy.cta}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default Onboarding;
