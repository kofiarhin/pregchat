import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import content from "../content/appContent.json";
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

/* ---------------- utils ---------------- */
const getBaseUrl = () => {
  const envBase = typeof BASE_URL === "string" ? BASE_URL.trim() : "";
  if (envBase) return envBase;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return null;
};

const resolveBabyImageUrl = (rawUrl) => {
  if (!rawUrl) return null;
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).toString();
  } catch {
    const base = getBaseUrl();
    if (!base) return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    try {
      return new URL(trimmed, base).toString();
    } catch {
      return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    }
  }
};

const formatDate = (input) => {
  if (!input) return "\u2014";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "\u2014";
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatGestation = (dayIndex) => {
  if (dayIndex == null) return "\u2014";
  const weeks = Math.floor(dayIndex / 7);
  const days = dayIndex % 7;
  return `${weeks}w ${days}d`;
};

const getTrimester = (dayIndex) => {
  if (dayIndex == null) return null;
  if (dayIndex < 84) return { label: "1st Trimester", number: 1 };
  if (dayIndex < 189) return { label: "2nd Trimester", number: 2 };
  return { label: "3rd Trimester", number: 3 };
};

const getDaysRemaining = (dueDate) => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const diff = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

/* ---------------- component ---------------- */
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
    retry: 2,
    retryDelay: (attempt) => Math.min(5000 * 2 ** attempt, 30000),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
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

  const trimester = getTrimester(gestationDays);
  const daysRemaining = getDaysRemaining(pregnancyProfile?.dueDate);

  const previewTitle =
    babyPreview?.week != null
      ? `Week ${babyPreview.week}`
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
    if (!currentUser?.name) return "";
    return currentUser.name.split(" ")[0];
  }, [currentUser?.name]);

  const handleFormSubmit = ({ mode, dueDate, lmpDate }) => {
    updateMutation.mutate({ mode, dueDate, lmpDate });
  };

  const friendlyTodayFallback = !hasProfile
    ? copy.emptyProfile?.description
    : todayError?.message || "No update available yet.";

  /* ---------- render ---------- */
  return (
    <main className={styles.dashboard}>
      {/* ---- Hero header ---- */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroGreeting}>
            {copy.welcome}{firstName ? `, ${firstName}` : ""}
          </p>
          <h1 className={styles.heroHeadline}>
            {gestationDays != null ? (
              <>
                <span className={styles.heroDay}>Day {Math.min(280, gestationDays)}</span>
                <span className={styles.heroDivider}>/</span>
                <span className={styles.heroGestation}>{formatGestation(gestationDays)}</span>
              </>
            ) : (
              "Your pregnancy dashboard"
            )}
          </h1>
          {trimester && (
            <span className={styles.trimesterBadge}>{trimester.label}</span>
          )}
        </div>

        <div className={styles.heroRight}>
          {gestationDays != null && (
            <div className={styles.progressRing}>
              <svg viewBox="0 0 120 120" className={styles.ringSvg}>
                <circle
                  cx="60" cy="60" r="52"
                  className={styles.ringTrack}
                />
                <circle
                  cx="60" cy="60" r="52"
                  className={styles.ringFill}
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - progressPct / 100)}`}
                />
              </svg>
              <div className={styles.ringLabel}>
                <span className={styles.ringPct}>{progressPct}%</span>
                <span className={styles.ringCaption}>complete</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ---- Stat strip ---- */}
      {hasProfile && (
        <section className={styles.statStrip}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatDate(pregnancyProfile?.dueDate)}</span>
            <span className={styles.statLabel}>Due date</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatGestation(pregnancyProfile?.dayIndex)}</span>
            <span className={styles.statLabel}>Gestational age</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {daysRemaining != null ? daysRemaining : "\u2014"}
            </span>
            <span className={styles.statLabel}>Days remaining</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatDate(pregnancyProfile?.lmpDate)}</span>
            <span className={styles.statLabel}>Last period</span>
          </div>
        </section>
      )}

      {/* ---- Main grid ---- */}
      <section className={styles.grid}>
        {/* Today's update */}
        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Today's Update</h2>
            {gestationDays != null && (
              <span className={styles.cardBadge}>Day {Math.min(280, gestationDays)}</span>
            )}
          </header>

          {todayLoading ? (
            <div className={styles.skeletonBlock} aria-hidden="true" />
          ) : today ? (
            <div className={styles.updateBody}>
              <div className={styles.updateSection}>
                <h3 className={styles.updateLabel}>Baby</h3>
                <p className={styles.updateText}>{today.babyUpdate}</p>
              </div>
              <div className={styles.updateSection}>
                <h3 className={styles.updateLabel}>Mother</h3>
                <p className={styles.updateText}>{today.momUpdate}</p>
              </div>
              {today.tips && (
                <p className={styles.tipText}>{today.tips}</p>
              )}
              {Array.isArray(today.references) && today.references.length > 0 && (
                <div className={styles.references}>
                  <span className={styles.referencesLabel}>References</span>
                  <ul>
                    {today.references.map((ref) => (
                      <li key={ref.url || ref.title}>
                        <a href={ref.url} target="_blank" rel="noreferrer">
                          {ref.title || ref.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className={styles.muted}>{friendlyTodayFallback}</p>
          )}
        </article>

        {/* Baby preview */}
        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Baby Preview</h2>
            {babyPreview?.week != null && (
              <span className={styles.cardBadge}>{previewTitle}</span>
            )}
          </header>

          {babyPreviewLoading ? (
            <div className={styles.previewPlaceholder} aria-hidden="true" />
          ) : babyPreview?.url ? (
            <>
              <div className={styles.previewFrame}>
                <img
                  className={styles.previewImage}
                  src={babyPreview.url}
                  alt={`Illustrative fetus render at week ${babyPreview.week ?? "unknown"}`}
                  loading="lazy"
                />
              </div>
              <p className={styles.previewCaption}>{previewCaption}</p>
            </>
          ) : previewErrorMessage ? (
            <p className={styles.muted}>{previewErrorMessage}</p>
          ) : (
            <p className={styles.muted}>Baby preview not available yet.</p>
          )}
        </article>

        {/* Pregnancy timeline / edit form */}
        <article className={styles.card}>
          {isEditing ? (
            <>
              <header className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Edit Timeline</h2>
              </header>
              <PregnancyDetailsForm
                initialValues={{
                  dueDate: pregnancyProfile?.dueDate
                    ? pregnancyProfile.dueDate.slice(0, 10)
                    : "",
                  lmpDate: pregnancyProfile?.lmpDate
                    ? pregnancyProfile.lmpDate.slice(0, 10)
                    : "",
                }}
                content={formCopy}
                submitLabel="Save changes"
                onSubmit={handleFormSubmit}
                onCancel={() => setIsEditing(false)}
                isSubmitting={updateMutation.isPending}
              />
            </>
          ) : (
            <>
              <header className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Timeline</h2>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              </header>
              {pregnancyLoading ? (
                <div className={styles.skeletonBlock} aria-hidden="true" />
              ) : (
                <dl className={styles.timelineList}>
                  <div className={styles.timelineItem}>
                    <dt>Due date</dt>
                    <dd>{formatDate(pregnancyProfile?.dueDate)}</dd>
                  </div>
                  <div className={styles.timelineItem}>
                    <dt>Last period</dt>
                    <dd>{formatDate(pregnancyProfile?.lmpDate)}</dd>
                  </div>
                  <div className={styles.timelineItem}>
                    <dt>Gestational age</dt>
                    <dd>{formatGestation(pregnancyProfile?.dayIndex)}</dd>
                  </div>
                  <div className={styles.timelineItem}>
                    <dt>Last updated</dt>
                    <dd>{formatDate(pregnancyProfile?.updatedAt)}</dd>
                  </div>
                </dl>
              )}
              {feedback && (
                <p className={styles.feedback} aria-live="polite">{feedback}</p>
              )}
            </>
          )}
        </article>

        {/* Quick actions */}
        <article className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Quick Actions</h2>
          </header>
          <div className={styles.quickActions}>
            <Link className={styles.quickAction} to="/chat">
              <span className={styles.quickActionIcon}>&#x1F4AC;</span>
              <span className={styles.quickActionLabel}>Chat with Aya</span>
            </Link>
            <Link className={styles.quickAction} to="/journals">
              <span className={styles.quickActionIcon}>&#x1F4D3;</span>
              <span className={styles.quickActionLabel}>Journal</span>
            </Link>
            <Link className={styles.quickAction} to="/appointments">
              <span className={styles.quickActionIcon}>&#x1F4C5;</span>
              <span className={styles.quickActionLabel}>Appointments</span>
            </Link>
            <Link className={styles.quickAction} to="/store">
              <span className={styles.quickActionIcon}>&#x1F6CD;</span>
              <span className={styles.quickActionLabel}>Store</span>
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
};

export default Dashboard;
