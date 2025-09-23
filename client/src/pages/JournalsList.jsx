import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./journalsList.styles.module.scss";
import content from "../content/appContent.json";
import { useCurrentUserQuery } from "../features/auth/hooks/useAuth.js";
import { useJournalsQuery } from "../features/journals/hooks/useJournalQueries.js";

const JournalsList = () => {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUserQuery();
  const userId = currentUser?._id ?? currentUser?.id ?? "";
  const listContent = content.journals.list;

  const {
    data: journals = [],
    isLoading,
    error,
  } = useJournalsQuery(userId, {
    enabled: Boolean(userId),
  });

  const formatter = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return formatter.format(parsed);
  };

  const createSnippet = (value = "") => {
    const normalized = value.trim();

    if (normalized.length <= 160) {
      return normalized;
    }

    return `${normalized.slice(0, 157)}…`;
  };

  const handleCreate = () => {
    navigate("/journals/new");
  };

  const handleSelect = (id) => () => {
    navigate(`/journals/${id}`);
  };

  const renderContent = () => {
    if (!userId) {
      return <div className={styles.feedback}>{listContent.noUser}</div>;
    }

    if (isLoading) {
      return <div className={styles.feedback}>{listContent.loading}</div>;
    }

    if (error) {
      return (
        <div className={`${styles.feedback} ${styles.feedbackError}`}>
          {error.message || listContent.error}
        </div>
      );
    }

    if (!journals.length) {
      return <div className={styles.feedback}>{listContent.empty}</div>;
    }

    return (
      <ul className={styles.list}>
        {journals.map((journal) => (
          <li key={journal._id}>
            <button
              type="button"
              className={styles.card}
              onClick={handleSelect(journal._id)}
            >
              <div className={styles.cardHeader}>
                <h2>{journal.title}</h2>
                <span className={styles.date}>{formatDate(journal.date)}</span>
              </div>
              {journal.content && (
                <p className={styles.snippet}>{createSnippet(journal.content)}</p>
              )}
              <span className={styles.viewLink}>{listContent.view}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{listContent.title}</h1>
          <p>{listContent.description}</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={handleCreate}>
          {listContent.newJournal}
        </button>
      </header>
      {renderContent()}
    </main>
  );
};

export default JournalsList;
