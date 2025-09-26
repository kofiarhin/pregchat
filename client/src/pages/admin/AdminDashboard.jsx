import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { loadStoredUser } from "../../features/auth/storage.js";
import "./adminDashboard.styles.scss";

const AdminDashboard = () => {
  const user = useMemo(() => loadStoredUser(), []);

  if (!user || user.isAdmin !== true) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="adminDashboard">
      <header className="adminDashboard__header">
        <div>
          <p className="adminDashboard__eyebrow">Internal tools</p>
          <h1 className="adminDashboard__title">Admin Control Center</h1>
          <p className="adminDashboard__subtitle">
            Manage daily pregnancy content and curated store products in one place.
          </p>
        </div>
      </header>
      <section className="adminDashboard__grid">
        <article className="adminDashboard__card">
          <h2>Daily content</h2>
          <p>Review and publish daily pregnancy updates for the chatbot experience.</p>
          <button type="button" className="adminDashboard__button" disabled>
            Coming soon
          </button>
        </article>
        <article className="adminDashboard__card">
          <h2>Store catalog</h2>
          <p>Curate recommended products and keep pricing information current.</p>
          <button type="button" className="adminDashboard__button" disabled>
            Coming soon
          </button>
        </article>
      </section>
    </div>
  );
};

export default AdminDashboard;
