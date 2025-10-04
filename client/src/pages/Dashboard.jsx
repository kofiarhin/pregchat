import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import content from "../content/appContent.json";
import ActionsMenu from "../components/ActionsMenu.jsx";
import PregnancyDetailsForm from "../components/PregnancyDetailsForm.jsx";
import { useCurrentUserQuery } from "../features/auth/hooks/useAuth.js";
import {
  usePregnancyProfileQuery,
  useResetPregnancyProfileMutation,
  useTodayPregnancyQuery,
  useUpdatePregnancyProfileMutation,
} from "../features/pregnancy/hooks/usePregnancy.js";
import { http } from "../api/http.js";
import { BASE_URL } from "../constants/baseUrl.js";
import styles from "./dashboard.styles.module.scss";

const getBaseUrl = () => {
  const envBase = typeof BASE_URL === "string" ? BASE_URL.trim() : "";

  if (envBase) {
    return envBase;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return null;
};

const resolveBabyImageUrl = (rawUrl) => {
  if (!rawUrl) {
    return null;
  }

  const trimmed = String(rawUrl).trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).toString();
  } catch (error) {
    const base = getBaseUrl();

    if (!base) {
      return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    }

    try {
      return new URL(trimmed, base).toString();
    } catch (fallbackError) {
      return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    }
  }
};

const formatDate = (input) => {
  if (!input) {
    return "—";
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString();
};

const formatGestation = (dayIndex) => {
  if (dayIndex == null) {
    return "—";
  }

  const weeks = Math.floor(dayIndex / 7);
  const days = dayIndex % 7;
  return `${weeks}w ${days}d`;
};

const Dashboard = () => {
  const copy = content.dashboard ?? {};
  const formCopy = content.forms?.pregnancyDetails ?? {};
  const { data: currentUser } = useCurrentUserQuery();
  const { data: pregnancyProfile, isLoading: pregnancyLoading } =
    usePregnancyProfileQuery();
  const hasProfile = Boolean(
    pregnancyProfile?.dueDate || pregnancyProfile?.lmpDate
  );
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState("");

  const {
    data: today,
    isLoading: todayLoading,
    error: todayError,
  } = useTodayPregnancyQuery({ enabled: hasProfile });

  const londonDateKey = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return formatter.format(new Date());
  }, []);

  const {
    data: babyPreview,
    isLoading: babyPreviewLoading,
    error: babyPreviewError,
  } = useQuery({
    queryKey: ["baby-image", "today", londonDateKey],
    queryFn: async () => {
      const response = await http.get("/api/baby-image/today", {
        credentials: "omit",
      });

      return {
        url: resolveBabyImageUrl(response?.url),
        week: response?.week ?? null,
        day: response?.day ?? null,
        dateKey: response?.dateKey ?? null,
        isCached: Boolean(response?.isCached),
      };
    },
    enabled: hasProfile,
    retry: 1,
  });

  const updateMutation = useUpdatePregnancyProfileMutation({
    onSuccess: () => {
      setIsEditing(false);
      setFeedback(copy.emptyProfile?.success || "");
    },
  });

  const resetMutation = useResetPregnancyProfileMutation({
    onSuccess: () => {
      setIsEditing(false);
      setFeedback("");
    },
  });

  const gestationDays = today?.day ?? today?.dayIndex ?? null;
  const progressPct =
    gestationDays != null
      ? Math.min(100, Math.round((gestationDays / 280) * 100))
      : 0;

  const previewTitle =
    babyPreview?.week != null
      ? `Baby Preview — Week ${babyPreview.week}`
      : "Baby Preview";

  const previewCaption =
    babyPreview?.week != null && babyPreview?.day != null
      ? `Illustrative render for ${babyPreview.week}w ${babyPreview.day}d (not medical advice).`
      : "Illustrative render (not medical advice).";

  const previewErrorMessage = babyPreviewError
    ? babyPreviewError.status === 404
      ? copy.emptyProfile?.description
      : "Unable to load today's baby preview."
    : null;

  const firstName = useMemo(() => {
    if (!currentUser?.name) {
      return "";
    }

    return currentUser.name.split(" ")[0];
  }, [currentUser?.name]);

  const handleFormSubmit = ({ mode, dueDate, lmpDate }) => {
    updateMutation.mutate({ mode, dueDate, lmpDate });
  };

  const handleReset = () => {
    const message = copy.summary?.confirmReset || "Reset pregnancy details?";
    if (window.confirm(message)) {
      resetMutation.mutate();
    }
  };

  const renderPregnancyCard = () => {
    if (pregnancyLoading) {
      return <p className={styles.muted}>Loading your details...</p>;
    }

    if (!hasProfile || isEditing) {
      return (
        <div className={styles.onboardingCard}>
          <h2 className={styles.cardTitle}>{copy.emptyProfile?.title}</h2>
          <p className={styles.muted}>{copy.emptyProfile?.description}</p>
          <PregnancyDetailsForm
            initialValues={{
              mode: hasProfile ? undefined : "dueDate",
              dueDate: pregnancyProfile?.dueDate
                ? pregnancyProfile.dueDate.slice(0, 10)
                : "",
              lmpDate: pregnancyProfile?.lmpDate
                ? pregnancyProfile.lmpDate.slice(0, 10)
                : "",
            }}
            content={formCopy}
            submitLabel={copy.emptyProfile?.submit}
            onSubmit={handleFormSubmit}
            onCancel={hasProfile ? () => setIsEditing(false) : undefined}
            isSubmitting={updateMutation.isPending}
          />
        </div>
      );
    }

    return (
      <div className={styles.summaryCard}>
        <header className={styles.summaryHeader}>
          <div>
            <h2 className={styles.cardTitle}>{copy.summary?.title}</h2>
            {feedback && <p className={styles.feedback}>{feedback}</p>}
          </div>
          <div className={styles.summaryActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setIsEditing(true)}
            >
              {copy.summary?.edit}
            </button>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={handleReset}
              disabled={resetMutation.isPending}
            >
              {copy.summary?.reset}
            </button>
          </div>
        </header>
        <dl className={styles.summaryList}>
          <div>
            <dt>{copy.summary?.dueDate}</dt>
            <dd>{formatDate(pregnancyProfile?.dueDate)}</dd>
          </div>
          <div>
            <dt>{copy.summary?.lmpDate}</dt>
            <dd>{formatDate(pregnancyProfile?.lmpDate)}</dd>
          </div>
          <div>
            <dt>{copy.summary?.gestation}</dt>
            <dd>{formatGestation(pregnancyProfile?.dayIndex)}</dd>
          </div>
          <div>
            <dt>{copy.summary?.updated}</dt>
            <dd>{formatDate(pregnancyProfile?.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    );
  };

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>
            {copy.welcome}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className={styles.muted}>
            {gestationDays != null
              ? `Day ${gestationDays} · ${formatGestation(gestationDays)}`
              : copy.emptyProfile?.description}
          </p>
        </div>
        <div className={styles.headerActions}>
          <ActionsMenu />
          <div className={styles.headerButtons}>
            <Link className={styles.primaryButton} to="/chat">
              {copy.actions?.openChat}
            </Link>
            <Link className={styles.secondaryButton} to="/onboarding">
              {copy.actions?.goToOnboarding}
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.grid}>
        <article className={styles.primaryCard}>{renderPregnancyCard()}</article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>{previewTitle}</h2>
          {babyPreviewLoading ? (
            <div className={styles.previewPlaceholder} aria-hidden="true" />
          ) : babyPreview?.url ? (
            <>
              <p className={styles.muted}>{previewCaption}</p>
              <div className={styles.previewFrame}>
                <img
                  className={styles.previewImage}
                  src={babyPreview.url}
                  alt={`Illustrative fetus render at week ${
                    babyPreview.week ?? "unknown"
                  }`}
                  loading="lazy"
                />
              </div>
              {babyPreview?.isCached &&
                babyPreview?.dateKey &&
                babyPreview.dateKey !== londonDateKey && (
                  <p className={styles.muted}>
                    Showing your most recent preview.
                  </p>
                )}
            </>
          ) : previewErrorMessage ? (
            <p className={styles.muted}>{previewErrorMessage}</p>
          ) : (
            <p className={styles.muted}>Baby preview not available yet.</p>
          )}
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Today's Update</h2>
          {todayLoading ? (
            <p className={styles.muted}>Loading...</p>
          ) : today ? (
            <>
              <h3 className={styles.cardSubtitle}>Baby</h3>
              <p>{today.babyUpdate}</p>
              <h3 className={styles.cardSubtitle}>Mother</h3>
              <p>{today.momUpdate}</p>
              {today.tips && <p className={styles.muted}>{today.tips}</p>}
              {Array.isArray(today.references) &&
                today.references.length > 0 && (
                  <div className={styles.sources}>
                    <span className={styles.muted}>References:</span>
                    <ul>
                      {today.references.map((reference) => (
                        <li key={reference.url || reference.title}>
                          <a
                            href={reference.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {reference.title || reference.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </>
          ) : (
            <p className={styles.muted}>
              {todayError?.message || "No update available yet."}
            </p>
          )}
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Quick Actions</h2>
          <div className={styles.actions}>
            <Link className={styles.action} to="/chat">
              {copy.actions?.ask}
            </Link>
            <Link className={styles.action} to="/onboarding">
              {copy.actions?.update}
            </Link>
            <Link className={styles.action} to="/profile">
              {copy.actions?.profile}
            </Link>
          </div>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>{copy.progress?.title}</h2>
          {gestationDays != null ? (
            <>
              <div className={styles.progress}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className={styles.muted}>
                {Math.min(280, gestationDays)}/280 days
              </p>
            </>
          ) : (
            <p className={styles.muted}>{copy.progress?.empty}</p>
          )}
        </article>
      </section>
    </main>
  );
};

export default Dashboard;
