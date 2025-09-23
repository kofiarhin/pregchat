import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUserQuery } from "../features/auth/hooks/useAuth.js";
import { useTodayPregnancyQuery } from "../features/pregnancy/hooks/usePregnancy.js";
import { http } from "../api/http.js";
import ActionsMenu from "../components/ActionsMenu.jsx";
import "./dashboard.styles.scss";

const Dashboard = () => {
  const { data: currentUser } = useCurrentUserQuery();
  const {
    data: today,
    isLoading: todayLoading,
    error: todayError,
  } = useTodayPregnancyQuery();

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
      const response = await http.get("/api/baby-image/today");

      return {
        url: response?.url ?? null,
        week: response?.week ?? null,
        day: response?.day ?? null,
        dateKey: response?.dateKey ?? null,
        isCached: Boolean(response?.isCached),
      };
    },
    retry: 1,
  });

  const gestationDays = today?.day ?? null;
  const week = gestationDays != null ? Math.floor(gestationDays / 7) : null;
  const progressPct = gestationDays != null
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
      ? "Add your pregnancy profile to unlock the baby preview."
      : "Unable to load today's baby preview."
    : null;

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__header-info">
          <h1>Welcome{currentUser?.firstName ? `, ${currentUser.firstName}` : ""}</h1>
          <p className="muted">
            {gestationDays != null
              ? `Day ${gestationDays} - Week ${week}`
              : "Set your due date to unlock personalised updates."}
          </p>
        </div>
        <div className="dashboard__header-actions">
          <ActionsMenu />
          <div className="dashboard__header-cta">
            <a className="btn" href="/chat">Open Chat</a>
            <a className="btn btn--ghost" href="/onboarding">Edit Profile</a>
          </div>
        </div>
      </header>

      <section className="grid">
        <article className="card baby-preview">
          <h2>{previewTitle}</h2>
          {babyPreviewLoading ? (
            <div className="baby-preview__placeholder" aria-hidden="true" />
          ) : babyPreview?.url ? (
            <>
              <p className="muted baby-preview__caption">{previewCaption}</p>
              <div className="baby-preview__image-frame">
                <img
                  src={babyPreview.url}
                  alt={`Illustrative fetus render at week ${babyPreview.week ?? "unknown"}`}
                  loading="lazy"
                />
              </div>
              {babyPreview?.isCached &&
                babyPreview?.dateKey &&
                babyPreview.dateKey !== londonDateKey && (
                  <p className="muted baby-preview__message">
                    Showing your most recent preview.
                  </p>
                )}
            </>
          ) : previewErrorMessage ? (
            <p className="muted baby-preview__message">{previewErrorMessage}</p>
          ) : (
            <p className="muted baby-preview__message">
              Baby preview not available yet.
            </p>
          )}
        </article>

        <article className="card">
          <h2>Today's Update</h2>
          {todayLoading ? (
            <p>Loading...</p>
          ) : today ? (
            <>
              <h3 className="card__sub">Baby</h3>
              <p>{today.babyUpdate}</p>
              <h3 className="card__sub">Mother</h3>
              <p>{today.momUpdate}</p>
              {today.tips && <p className="muted">{today.tips}</p>}
              {Array.isArray(today.references) && today.references.length > 0 && (
                <div className="sources">
                  <span className="muted">References:</span>
                  <ul>
                    {today.references.map((reference) => (
                      <li key={reference.url || reference.title}>
                        <a href={reference.url} target="_blank" rel="noreferrer">
                          {reference.title || reference.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p>{todayError?.message || "No update available yet."}</p>
          )}
        </article>

        <article className="card">
          <h2>Quick Actions</h2>
          <div className="actions">
            <a className="action" href="/chat">Ask a question</a>
            <a className="action" href="/onboarding">Update profile</a>
            <a className="action" href="/profile">View profile</a>
          </div>
        </article>

        <article className="card">
          <h2>Progress</h2>
          {gestationDays != null ? (
            <>
              <div className="progress">
                <div className="progress__bar" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="muted">{Math.min(280, gestationDays)}/280 days</p>
            </>
          ) : (
            <p>Set your due date to see progress.</p>
          )}
        </article>
      </section>
    </main>
  );
};

export default Dashboard;
