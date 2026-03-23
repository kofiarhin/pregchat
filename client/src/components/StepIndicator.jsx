import styles from "./stepIndicator.styles.module.scss";

const StepIndicator = ({ currentStep, totalSteps }) => {
  return (
    <div className={styles.indicator} role="navigation" aria-label="Onboarding progress">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isActive = i === currentStep;
        const isComplete = i < currentStep;
        const className = [
          styles.dot,
          isActive ? styles.active : "",
          isComplete ? styles.complete : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={i}
            className={className}
            aria-current={isActive ? "step" : undefined}
            aria-label={`Step ${i + 1} of ${totalSteps}${isComplete ? " (completed)" : isActive ? " (current)" : ""}`}
          />
        );
      })}
    </div>
  );
};

export default StepIndicator;
