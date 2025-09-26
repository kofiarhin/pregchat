import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import sharedStyles from "./Appointments.styles.module.scss";
import styles from "./AppointmentMidwife.styles.module.scss";
import content from "../content/appContent.json";
import {
  useAvailabilityQuery,
  useCreateAppointmentMutation,
  useMidwifeQuery,
} from "../features/appointments/hooks/useAppointmentQueries.js";
import { useBooking } from "../context/BookingContext.jsx";
import {
  formatLondonDateTime,
  getLondonRangeIso,
  groupSlotsByDay,
  isSlotInPast,
} from "../utils/londonTime.js";

const placeholderPhoto = "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=400&q=80";

const AppointmentMidwife = () => {
  const { id } = useParams();
  const { identity } = useBooking();
  const [selectedRangeId, setSelectedRangeId] = useState("week");
  const [availabilityParams, setAvailabilityParams] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formValues, setFormValues] = useState({
    userName: identity.userName || "",
    userEmail: identity.userEmail || "",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [actionMessage, setActionMessage] = useState(null);

  const {
    data: midwife,
    isLoading: midwifeLoading,
    error: midwifeError,
  } = useMidwifeQuery(id, {
    enabled: Boolean(id),
  });

  const availabilityQuery = useAvailabilityQuery(availabilityParams, {
    enabled: Boolean(availabilityParams?.midwifeId),
  });

  const createAppointment = useCreateAppointmentMutation({
    onSuccess: () => {
      setSelectedSlot(null);
      setFormError("");
      setFormValues({
        userName: identity.userName || "",
        userEmail: identity.userEmail || "",
        notes: "",
      });
      setActionMessage({
        type: "success",
        text: content.appointments.midwife.success,
      });
    },
    onError: (error) => {
      setFormError(error?.payload?.error || error?.message || content.appointments.midwife.error);
    },
  });

  const rangeOptions = useMemo(
    () => [
      {
        id: "week",
        label: content.appointments.midwife.thisWeek,
        days: 7,
      },
      {
        id: "twoWeeks",
        label: content.appointments.midwife.nextTwoWeeks,
        days: 14,
      },
    ],
    []
  );

  const groupedSlots = useMemo(() => {
    const slots = availabilityQuery.data?.slots || [];
    return groupSlotsByDay(slots);
  }, [availabilityQuery.data]);

  const handleRangeSelect = (rangeId) => () => {
    setSelectedRangeId(rangeId);
  };

  const handleLoadAvailability = () => {
    const option = rangeOptions.find((range) => range.id === selectedRangeId);

    if (!option || !id) {
      return;
    }

    const range = getLondonRangeIso(option.days);
    setAvailabilityParams({
      midwifeId: id,
      fromISO: range.fromISO,
      toISO: range.toISO,
    });
    setActionMessage(null);
  };

  const handleSlotSelect = (slotIso) => () => {
    setSelectedSlot(slotIso);
    setFormValues({
      userName: identity.userName || "",
      userEmail: identity.userEmail || "",
      notes: "",
    });
    setFormError("");
  };

  const handleModalClose = () => {
    setSelectedSlot(null);
    setFormError("");
  };

  const handleFormChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedSlot || !id) {
      return;
    }

    if (!formValues.userName?.trim() || !formValues.userEmail?.trim()) {
      setFormError(content.appointments.midwife.required);
      return;
    }

    createAppointment.mutate({
      userId: identity.userId || undefined,
      userName: formValues.userName.trim(),
      userEmail: formValues.userEmail.trim(),
      notes: formValues.notes?.trim() ? formValues.notes.trim() : undefined,
      midwifeId: id,
      startISO: selectedSlot,
    });
  };

  const renderModal = () => {
    if (!selectedSlot) {
      return null;
    }

    return (
      <div className={styles.modalOverlay} role="dialog" aria-modal="true">
        <div className={styles.modal}>
          <h3>{content.appointments.midwife.modalTitle}</h3>
          <div className={styles.modalDetails}>{formatLondonDateTime(selectedSlot)}</div>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="booking-name" className={styles.label}>
                {content.appointments.midwife.nameLabel}
              </label>
              <input
                id="booking-name"
                className={styles.input}
                type="text"
                value={formValues.userName}
                onChange={handleFormChange("userName")}
                autoComplete="name"
                placeholder={content.appointments.midwife.namePlaceholder}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="booking-email" className={styles.label}>
                {content.appointments.midwife.emailLabel}
              </label>
              <input
                id="booking-email"
                className={styles.input}
                type="email"
                value={formValues.userEmail}
                onChange={handleFormChange("userEmail")}
                autoComplete="email"
                placeholder={content.appointments.midwife.emailPlaceholder}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="booking-notes" className={styles.label}>
                {content.appointments.midwife.notesLabel}
              </label>
              <textarea
                id="booking-notes"
                className={styles.textarea}
                value={formValues.notes}
                onChange={handleFormChange("notes")}
                placeholder={content.appointments.midwife.notesPlaceholder}
              />
            </div>
            {formError && <div className={styles.errorText}>{formError}</div>}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={sharedStyles.secondaryButton}
                onClick={handleModalClose}
                disabled={createAppointment.isPending}
              >
                {content.appointments.midwife.cancel}
              </button>
              <button
                type="submit"
                className={sharedStyles.primaryButton}
                disabled={createAppointment.isPending}
              >
                {createAppointment.isPending
                  ? content.appointments.midwife.submitting
                  : content.appointments.midwife.confirm}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (midwifeLoading) {
    return (
      <main className={sharedStyles.page}>
        <div className={sharedStyles.feedback}>
          {content.appointments.midwife.loading}
        </div>
      </main>
    );
  }

  if (midwifeError || !midwife) {
    return (
      <main className={sharedStyles.page}>
        <div className={`${sharedStyles.feedback} ${sharedStyles.alert} ${sharedStyles.alertError}`}>
          {midwifeError?.message || content.appointments.midwife.error}
        </div>
      </main>
    );
  }

  const midwifePhoto = midwife.photo || placeholderPhoto;

  return (
    <main className={`${sharedStyles.page} ${styles.midwifePage}`}>
      <section className={styles.profileCard}>
        <div className={styles.profilePhoto}>
          <img src={midwifePhoto} alt={midwife.name} loading="lazy" />
        </div>
        <div className={styles.profileDetails}>
          <h2>{midwife.name}</h2>
          {midwife.bio && <p className={styles.profileBio}>{midwife.bio}</p>}
          {Array.isArray(midwife.specialties) && midwife.specialties.length > 0 && (
            <div className={styles.profileSpecialties}>
              {midwife.specialties.map((item) => (
                <span key={item} className={styles.profileTag}>
                  {item}
                </span>
              ))}
            </div>
          )}
          <span className={sharedStyles.timezoneNote}>
            {content.appointments.shared.timezoneNote}
          </span>
        </div>
      </section>

      <section className={styles.slotSection}>
        <div className={styles.availabilityHeader}>
          <h3>{content.appointments.midwife.availabilityTitle}</h3>
          <p className={sharedStyles.timezoneNote}>
            {content.appointments.midwife.availabilityHelp}
          </p>
          <div className={styles.rangeButtons}>
            {rangeOptions.map((range) => (
              <button
                key={range.id}
                type="button"
                className={`${styles.rangeButton} ${
                  selectedRangeId === range.id ? "active" : ""
                }`}
                onClick={handleRangeSelect(range.id)}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={sharedStyles.primaryButton}
            onClick={handleLoadAvailability}
            disabled={!selectedRangeId || availabilityQuery.isFetching}
          >
            {availabilityQuery.isFetching
              ? content.appointments.midwife.loadingSlots
              : content.appointments.midwife.loadAvailability}
          </button>
        </div>

        {actionMessage && (
          <div
            className={`${sharedStyles.alert} ${
              actionMessage.type === "success"
                ? sharedStyles.alertSuccess
                : sharedStyles.alertError
            }`}
          >
            {actionMessage.text}
          </div>
        )}

        {availabilityQuery.error && (
          <div className={`${sharedStyles.alert} ${sharedStyles.alertError}`}>
            {availabilityQuery.error?.message || content.appointments.midwife.error}
          </div>
        )}

        {availabilityQuery.isFetched && groupedSlots.length === 0 && !availabilityQuery.error && (
          <div className={sharedStyles.feedback}>
            {content.appointments.midwife.noSlots}
          </div>
        )}

        {groupedSlots.length > 0 && (
          <div className={styles.slotGroups}>
            {groupedSlots.map((group) => (
              <div key={group.key} className={styles.slotGroup}>
                <span className={styles.slotGroupHeader}>{group.label}</span>
                <div className={styles.slotList}>
                  {group.slots.map((slot) => (
                    <button
                      key={slot.iso}
                      type="button"
                      className={styles.slotButton}
                      onClick={handleSlotSelect(slot.iso)}
                      disabled={isSlotInPast(slot.iso) || availabilityQuery.isFetching}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {renderModal()}
    </main>
  );
};

export default AppointmentMidwife;
