import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./journalDetail.styles.module.scss";
import content from "../content/appContent.json";
import { useCurrentUserQuery } from "../features/auth/hooks/useAuth.js";
import {
  useDeleteJournalMutation,
  useJournalQuery,
} from "../features/journals/hooks/useJournalQueries.js";

const JournalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUserQuery();
  const userId = currentUser?._id ?? currentUser?.id ?? "";
  const detailContent = content.journals.detail;

  const formatter = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const {
    data: journal,
    isLoading,
    error,
  } = useJournalQuery(id, userId, {
    enabled: Boolean(id && userId),
  });

  const { mutateAsync: deleteJournal, isPending: isDeleting } =
    useDeleteJournalMutation({
      onSuccess: () => {
        navigate("/journals");
      },
    });

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

  const handleBack = () => {
    navigate("/journals");
  };

  const handleEdit = () => {
    navigate(`/journals/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!id || !userId) {
      return;
    }

    const confirmed = window.confirm(detailContent.confirmDelete);

    if (!confirmed) {
      return;
    }

    try {
      await deleteJournal({ id, userId });
    } catch (mutationError) {
      // Intentionally silent; error surfaced via toast/query client
    }
  };

  const renderContent = () => {
    if (!userId) {
      return (
        <div className={styles.feedback}>{content.journals.list.noUser}</div>
      );
    }

    if (isLoading) {
      return <div className={styles.feedback}>{detailContent.loading}</div>;
    }

    if (error) {
      return (
        <div className={`${styles.feedback} ${styles.feedbackError}`}>
          {error.message || detailContent.error}
        </div>
      );
    }

    if (!journal) {
      return <div className={styles.feedback}>{detailContent.notFound}</div>;
    }

    const paragraphs = journal.content
      ? journal.content.split(/\n+/).filter((chunk) => chunk.trim().length > 0)
      : [];

    const parsedDate = journal.date ? new Date(journal.date) : null;
    const hasValidDate = parsedDate && !Number.isNaN(parsedDate.getTime());
    const isoDate = hasValidDate ? parsedDate.toISOString() : undefined;
    const readableDate = hasValidDate ? formatDate(parsedDate) : "";

    return (
      <article className={styles.card}>
        <header className={styles.cardHeader}>
          <h1>{journal.title}</h1>
          {hasValidDate && (
            <time dateTime={isoDate}>
              {`${detailContent.recordedOn} ${readableDate}`}
            </time>
          )}
        </header>
        <div className={styles.body}>
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))
          ) : (
            <p>{journal.content}</p>
          )}
        </div>
      </article>
    );
  };

  return (
    <main className={styles.page}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.backButton} onClick={handleBack}>
          {detailContent.back}
        </button>
        {journal && !error && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleEdit}
            >
              {detailContent.edit}
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? detailContent.deleting : detailContent.delete}
            </button>
          </div>
        )}
      </div>
      {renderContent()}
    </main>
  );
};

export default JournalDetail;
