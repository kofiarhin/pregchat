import content from "../content/appContent.json";
import { useCurrentUserQuery } from "../features/auth/hooks/useAuth.js";
import styles from "./profile.styles.module.scss";

const Profile = () => {
  const copy = content.profilePage ?? {};
  const labels = copy.labels ?? {};
  const { data: currentUser, isLoading } = useCurrentUserQuery();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.subtitle}>{copy.subtitle}</p>
        </header>

        {isLoading ? (
          <p className={styles.muted}>Loading...</p>
        ) : (
          <dl className={styles.list}>
            <div>
              <dt>{labels.name}</dt>
              <dd>{currentUser?.name || "—"}</dd>
            </div>
            <div>
              <dt>{labels.email}</dt>
              <dd>{currentUser?.email || "—"}</dd>
            </div>
            <div>
              <dt>{labels.region}</dt>
              <dd>{currentUser?.region || "—"}</dd>
            </div>
          </dl>
        )}
      </section>
    </main>
  );
};

export default Profile;
