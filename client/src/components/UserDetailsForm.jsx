import { useState } from "react";
import styles from "./userDetailsForm.styles.module.scss";

const UserDetailsForm = ({ onSubmit, onSkip, isSubmitting = false, content = {} }) => {
  const copy = content;

  const [isFirstPregnancy, setIsFirstPregnancy] = useState(null);
  const [babyGender, setBabyGender] = useState(null);
  const [updateFrequency, setUpdateFrequency] = useState("daily");
  const [healthConsiderations, setHealthConsiderations] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      isFirstPregnancy: isFirstPregnancy ?? true,
      babyGender,
      updateFrequency,
      healthConsiderations,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          {copy.isFirstPregnancy || "Is this your first pregnancy?"}
        </legend>
        <div className={styles.radioGroup}>
          <label className={styles.radioOption}>
            <input
              type="radio"
              name="isFirstPregnancy"
              checked={isFirstPregnancy === true}
              onChange={() => setIsFirstPregnancy(true)}
            />
            <span>Yes</span>
          </label>
          <label className={styles.radioOption}>
            <input
              type="radio"
              name="isFirstPregnancy"
              checked={isFirstPregnancy === false}
              onChange={() => setIsFirstPregnancy(false)}
            />
            <span>No</span>
          </label>
        </div>
      </fieldset>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="babyGender">
          {copy.babyGender || "Do you know the baby's gender?"}
        </label>
        <select
          id="babyGender"
          className={styles.input}
          value={babyGender ?? ""}
          onChange={(e) => setBabyGender(e.target.value || null)}
        >
          <option value="">Prefer not to say</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="unknown">Don't know yet</option>
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="updateFrequency">
          {copy.updateFrequency || "How often would you like updates?"}
        </label>
        <select
          id="updateFrequency"
          className={styles.input}
          value={updateFrequency}
          onChange={(e) => setUpdateFrequency(e.target.value)}
        >
          <option value="daily">Daily</option>
          <option value="few_times_week">A few times a week</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="healthConsiderations">
          {copy.healthConsiderations || "Any health considerations? (optional)"}
        </label>
        <textarea
          id="healthConsiderations"
          className={styles.textarea}
          rows={3}
          value={healthConsiderations}
          onChange={(e) => setHealthConsiderations(e.target.value)}
          placeholder="e.g. gestational diabetes, high blood pressure..."
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          onClick={onSkip}
          disabled={isSubmitting}
        >
          {copy.skip || "Skip for now"}
        </button>
        <button type="submit" className={styles.primary} disabled={isSubmitting}>
          {copy.submit || "Continue"}
        </button>
      </div>
    </form>
  );
};

export default UserDetailsForm;
