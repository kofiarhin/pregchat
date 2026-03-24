import { useState, useEffect } from "react";
import content from "../content/appContent.json";
import {
  useCurrentUserQuery,
  useUpdateUserMutation,
} from "../features/auth/hooks/useAuth.js";
import {
  usePregnancyProfileQuery,
  useUpdatePregnancyProfileMutation,
} from "../features/pregnancy/hooks/usePregnancy.js";
import styles from "./profile.styles.module.scss";

const REGIONS = ["UK", "US", "CA", "AU", "IE", "NZ"];

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toISOString().split("T")[0];
};

const Profile = () => {
  const copy = content.profilePage ?? {};
  const labels = copy.labels ?? {};
  const { data: currentUser, isLoading } = useCurrentUserQuery();
  const { data: pregnancy } = usePregnancyProfileQuery();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setRegion(currentUser.region || "");
    }
  }, [currentUser]);

  useEffect(() => {
    if (pregnancy) {
      setDueDate(formatDate(pregnancy.dueDate));
    }
  }, [pregnancy]);

  const updateUser = useUpdateUserMutation({
    onSuccess: () => {
      if (!dueDateChanged) setIsEditing(false);
    },
  });

  const updatePregnancy = useUpdatePregnancyProfileMutation({
    onSuccess: () => setIsEditing(false),
  });

  const dueDateChanged = formatDate(pregnancy?.dueDate) !== dueDate;
  const userChanged =
    name !== (currentUser?.name || "") ||
    region !== (currentUser?.region || "");

  const isSaving = updateUser.isPending || updatePregnancy.isPending;

  const handleSave = () => {
    if (userChanged) {
      updateUser.mutate({ name, region });
    }
    if (dueDateChanged && dueDate) {
      updatePregnancy.mutate({ mode: "edd", dueDate });
    }
    if (!userChanged && !dueDateChanged) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setName(currentUser?.name || "");
    setRegion(currentUser?.region || "");
    setDueDate(formatDate(pregnancy?.dueDate));
    setIsEditing(false);
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.subtitle}>{copy.subtitle}</p>
        </header>

        {isLoading ? (
          <p className={styles.muted}>Loading...</p>
        ) : isEditing ? (
          <div className={styles.form}>
            <label className={styles.field}>
              <span className={styles.label}>{labels.name || "Full name"}</span>
              <input
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{labels.email || "Email"}</span>
              <input
                className={styles.input}
                type="email"
                value={currentUser?.email || ""}
                disabled
                title="Email cannot be changed"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{labels.region || "Region"}</span>
              <select
                className={styles.input}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Due date</span>
              <input
                className={styles.input}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>

            <div className={styles.actions}>
              <button
                className={styles.saveBtn}
                type="button"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                className={styles.cancelBtn}
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <dl className={styles.list}>
              <div>
                <dt>{labels.name || "Full name"}</dt>
                <dd>{currentUser?.name || "\u2014"}</dd>
              </div>
              <div>
                <dt>{labels.email || "Email"}</dt>
                <dd>{currentUser?.email || "\u2014"}</dd>
              </div>
              <div>
                <dt>{labels.region || "Region"}</dt>
                <dd>{currentUser?.region || "\u2014"}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>
                  {pregnancy?.dueDate
                    ? new Date(pregnancy.dueDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Not set"}
                </dd>
              </div>
            </dl>

            <button
              className={styles.editBtn}
              type="button"
              onClick={() => setIsEditing(true)}
            >
              Edit profile
            </button>
          </>
        )}
      </section>
    </main>
  );
};

export default Profile;
