import React from "react";
import { useNavigate } from "react-router-dom";
import sharedStyles from "./Appointments.styles.module.scss";
import styles from "./AppointmentBrowse.styles.module.scss";
import content from "../content/appContent.json";
import { useMidwivesQuery } from "../features/appointments/hooks/useAppointmentQueries.js";

const placeholderPhoto = "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=400&q=80";

const AppointmentBrowse = () => {
  const navigate = useNavigate();
  const {
    data: midwives = [],
    isLoading,
    error,
  } = useMidwivesQuery();

  const handleViewProfile = (id) => () => {
    navigate(`/appointments/${id}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className={sharedStyles.feedback}>{content.appointments.browse.loading}</div>;
    }

    if (error) {
      return (
        <div className={`${sharedStyles.feedback} ${sharedStyles.alert} ${sharedStyles.alertError}`}>
          {error.message || content.appointments.browse.error}
        </div>
      );
    }

    if (midwives.length === 0) {
      return <div className={sharedStyles.feedback}>{content.appointments.browse.empty}</div>;
    }

    return (
      <div className={styles.grid}>
        {midwives.map((midwife) => {
          const photo = midwife.photo || placeholderPhoto;

          return (
            <article key={midwife._id} className={styles.card}>
              <div className={styles.photoWrapper}>
                <img src={photo} alt={midwife.name} loading="lazy" />
              </div>
              <div className={styles.content}>
                <h2>{midwife.name}</h2>
                {Array.isArray(midwife.specialties) && midwife.specialties.length > 0 && (
                  <div className={styles.specialties}>
                    {midwife.specialties.map((item) => (
                      <span key={item} className={styles.specialtyTag}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                {midwife.bio && <p className={styles.bio}>{midwife.bio}</p>}
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.viewButton}
                    onClick={handleViewProfile(midwife._id)}
                  >
                    {content.appointments.browse.viewProfile}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <main className={`${sharedStyles.page} ${styles.browsePage}`}>
      <div className={sharedStyles.header}>
        <div>
          <h1>{content.appointments.browse.title}</h1>
          <p>{content.appointments.browse.description}</p>
        </div>
        <span className={sharedStyles.timezoneNote}>
          {content.appointments.shared.timezoneNote}
        </span>
      </div>
      {renderContent()}
    </main>
  );
};

export default AppointmentBrowse;
