import React, { useState } from "react";
import sharedStyles from "./Appointments.styles.module.scss";
import styles from "./MyAppointments.styles.module.scss";
import content from "../content/appContent.json";
import {
  useCancelAppointmentMutation,
  useMyAppointmentsQuery,
} from "../features/appointments/hooks/useAppointmentQueries.js";
import { useBooking } from "../context/BookingContext.jsx";
import { formatLondonRange } from "../utils/londonTime.js";

const MyAppointments = () => {
  const { identity } = useBooking();
  const [feedback, setFeedback] = useState(null);
  const {
    data: appointments = [],
    isLoading,
    error,
  } = useMyAppointmentsQuery(identity.userId, {
    enabled: Boolean(identity.userId),
  });

  const cancelAppointment = useCancelAppointmentMutation({
    onSuccess: () => {
      setFeedback({ type: "success", text: content.appointments.mine.cancelSuccess });
    },
    onError: (mutationError) => {
      setFeedback({
        type: "error",
        text:
          mutationError?.payload?.error ||
          mutationError?.message ||
          content.appointments.mine.cancelError,
      });
    },
  });

  const handleCancel = (appointment) => () => {
    cancelAppointment.mutate({
      id: appointment._id,
      userId: identity.userId,
      midwifeId: appointment.midwife?._id || appointment.midwifeId,
    });
  };

  if (!identity.userId) {
    return (
      <main className={sharedStyles.page}>
        <div className={sharedStyles.feedback}>
          {content.appointments.mine.noUser}
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className={sharedStyles.page}>
        <div className={sharedStyles.feedback}>
          {content.appointments.mine.loading}
        </div>
      </main>
    );
  }

  return (
    <main className={`${sharedStyles.page} ${styles.myAppointments}`}>
      <div className={sharedStyles.header}>
        <div>
          <h1>{content.appointments.mine.title}</h1>
          <p>{content.appointments.mine.subtitle}</p>
        </div>
        <span className={sharedStyles.timezoneNote}>
          {content.appointments.shared.timezoneNote}
        </span>
      </div>

      {feedback && (
        <div
          className={`${sharedStyles.alert} ${
            feedback.type === "success"
              ? sharedStyles.alertSuccess
              : sharedStyles.alertError
          }`}
        >
          {feedback.text}
        </div>
      )}

      {error && (
        <div className={`${sharedStyles.alert} ${sharedStyles.alertError}`}>
          {error.message || content.appointments.mine.error}
        </div>
      )}

      {!error && appointments.length === 0 && (
        <div className={sharedStyles.feedback}>{content.appointments.mine.empty}</div>
      )}

      {appointments.length > 0 && (
        <div className={styles.list}>
          {appointments.map((appointment) => {
            const midwifeName = appointment.midwife?.name || appointment.midwifeName || content.appointments.mine.unknownMidwife;
            const status = appointment.status || "booked";
            const statusLabel =
              status === "cancelled"
                ? content.appointments.mine.statusCancelled
                : content.appointments.mine.statusBooked;
            const isCancelling = cancelAppointment.isPending && cancelAppointment.variables?.id === appointment._id;

            return (
              <article key={appointment._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>{midwifeName}</h2>
                  <span
                    className={`${styles.status} ${
                      status === "cancelled" ? styles.statusCancelled : styles.statusBooked
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <p className={styles.date}>{formatLondonRange(appointment.start, appointment.end)}</p>
                {appointment.notes && <p className={styles.notes}>{appointment.notes}</p>}
                {status !== "cancelled" && (
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={handleCancel(appointment)}
                      disabled={isCancelling}
                    >
                      {isCancelling
                        ? content.appointments.mine.cancelling
                        : content.appointments.mine.cancel}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default MyAppointments;
