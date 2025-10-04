import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./journalForm.styles.module.scss";
import content from "../content/appContent.json";
import { useCurrentUserQuery } from "../features/auth/hooks/useAuth.js";
import {
  useCreateJournalMutation,
  useJournalQuery,
  useUpdateJournalMutation,
} from "../features/journals/hooks/useJournalQueries.js";

const JournalForm = ({ mode = "create" }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const formContent = content.journals.form;
  const { data: currentUser } = useCurrentUserQuery();
  const userId = currentUser?._id ?? currentUser?.id ?? "";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    data: journal,
    isLoading: isJournalLoading,
    error: journalError,
  } = useJournalQuery(id, userId, {
    enabled: isEdit && Boolean(id && userId),
  });

  useEffect(() => {
    if (journal && isEdit) {
      setTitle(journal.title ?? "");
      setBody(journal.content ?? "");
    }
  }, [journal, isEdit]);

  const { mutateAsync: createJournal, isPending: isCreating } =
    useCreateJournalMutation({
      onSuccess: (data) => {
        navigate(`/journals/${data._id}`);
      },
    });

  const { mutateAsync: updateJournal, isPending: isUpdating } =
    useUpdateJournalMutation({
      onSuccess: (data) => {
        navigate(`/journals/${data._id}`);
      },
    });

  const resetError = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleTitleChange = (event) => {
    resetError();
    setTitle(event.target.value);
  };

  const handleBodyChange = (event) => {
    resetError();
    setBody(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userId) {
      setErrorMessage(content.journals.list.noUser);
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody) {
      setErrorMessage(formContent.required);
      return;
    }

    try {
      if (isEdit) {
        await updateJournal({
          id,
          userId,
          title: trimmedTitle,
          content: trimmedBody,
        });
      } else {
        await createJournal({
          userId,
          title: trimmedTitle,
          content: trimmedBody,
        });
      }
    } catch (mutationError) {
      setErrorMessage(mutationError?.message || formContent.submitError);
    }
  };

  const handleCancel = () => {
    navigate("/journals");
  };

  const isBusy = isCreating || isUpdating;

  const renderBody = () => {
    if (!userId) {
      return <div className={styles.feedback}>{content.journals.list.noUser}</div>;
    }

    if (isEdit && isJournalLoading) {
      return <div className={styles.feedback}>{formContent.loading}</div>;
    }

    if (isEdit && journalError) {
      return (
        <div className={`${styles.feedback} ${styles.feedbackError}`}>
          {journalError.message || formContent.loadError}
        </div>
      );
    }

    if (isEdit && !journal && !isJournalLoading) {
      return (
        <div className={styles.feedback}>
          {content.journals.detail.notFound}
        </div>
      );
    }

    return (
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>{formContent.titleLabel}</span>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className={styles.input}
            placeholder={formContent.titlePlaceholder}
            maxLength={150}
          />
        </label>
        <label className={styles.field}>
          <span>{formContent.contentLabel}</span>
          <textarea
            value={body}
            onChange={handleBodyChange}
            className={styles.textarea}
            placeholder={formContent.contentPlaceholder}
            rows={10}
          />
        </label>
        {errorMessage && (
          <div className={`${styles.feedback} ${styles.feedbackError}`}>
            {errorMessage}
          </div>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleCancel}
            disabled={isBusy}
          >
            {formContent.cancel}
          </button>
          <button type="submit" className={styles.primaryButton} disabled={isBusy}>
            {isBusy
              ? isEdit
                ? formContent.updating
                : formContent.saving
              : isEdit
              ? formContent.update
              : formContent.save}
          </button>
        </div>
      </form>
    );
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{isEdit ? formContent.editTitle : formContent.createTitle}</h1>
          {formContent.description && <p>{formContent.description}</p>}
        </div>
      </header>
      {renderBody()}
    </main>
  );
};

export default JournalForm;
