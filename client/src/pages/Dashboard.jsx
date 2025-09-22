import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './dashboard.styles.scss';
import { fetchTodayUpdate } from '../store/dailySlice';
import { fetchProfile } from '../store/profileSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { loading: profileLoading, data: profile } = useSelector((s) => s.profile);
  const { loading: dailyLoading, today } = useSelector((s) => s.daily);

  useEffect(() => {
    if (!profile) dispatch(fetchProfile());
    dispatch(fetchTodayUpdate());
  }, [dispatch]); // do not include profile to avoid re-fetch loop

  const week = profile?.gestationDays != null
    ? Math.floor(profile.gestationDays / 7)
    : null;

  const progressPct = profile?.gestationDays != null
    ? Math.min(100, Math.round((profile.gestationDays / 280) * 100))
    : 0;

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1>Welcome{user?.firstName ? `, ${user.firstName}` : ''}</h1>
          <p className="muted">
            {profile?.gestationDays != null
              ? `Day ${profile.gestationDays} · Week ${week}`
              : 'Set your due date to unlock personalized updates.'}
          </p>
        </div>
        <div className="dashboard__header-cta">
          <a className="btn" href="/chat">Open Chat</a>
          <a className="btn btn--ghost" href="/profile">Edit Profile</a>
        </div>
      </header>

      <section className="grid">
        <article className="card">
          <h2>Today’s Update</h2>
          {dailyLoading ? (
            <p>Loading...</p>
          ) : today ? (
            <>
              <h3 className="card__sub">Baby</h3>
              <p>{today.baby}</p>
              <h3 className="card__sub">Mother</h3>
              <p>{today.mother}</p>
              {Array.isArray(today.sources) && today.sources.length > 0 && (
                <div className="sources">
                  <span className="muted">Sources:</span>
                  <ul>
                    {today.sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.title || s.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p>No update available yet.</p>
          )}
        </article>

        <article className="card">
          <h2>Quick Actions</h2>
          <div className="actions">
            <a className="action" href="/chat">Ask a question</a>
            <a className="action" href="/journal">Log a symptom</a>
            <a className="action" href="/appointments">Add appointment</a>
          </div>
        </article>

        <article className="card">
          <h2>Progress</h2>
          {profileLoading ? (
            <p>Loading...</p>
          ) : profile?.gestationDays != null ? (
            <>
              <div className="progress">
                <div className="progress__bar" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="muted">{Math.min(280, profile.gestationDays)}/280 days</p>
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
