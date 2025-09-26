import { useState } from "react";
import InlineEditableField from "../components/InlineEditableField.jsx";
import "./profile.styles.scss";

const initialProfile = {
  _id: "000000000000000000000000",
  name: "PregChat Parent",
  weeks: 24,
  days: 3,
  dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
  frequency: "daily",
};

const frequencyOptions = [
  { value: "daily", label: "Daily check-ins" },
  { value: "few_per_week", label: "A few times per week" },
  { value: "weekly", label: "Weekly digest" },
];

const frequencyLabels = frequencyOptions.reduce((accumulator, option) => {
  accumulator[option.value] = option.label;
  return accumulator;
}, {});

const formatWeeks = (raw) => {
  if (raw === null || raw === undefined || raw === "") {
    return "";
  }
  const value = Number(raw);
  if (Number.isNaN(value)) {
    return "";
  }
  return `${value} week${value === 1 ? "" : "s"}`;
};

const formatDays = (raw) => {
  if (raw === null || raw === undefined || raw === "") {
    return "";
  }
  const value = Number(raw);
  if (Number.isNaN(value)) {
    return "";
  }
  return `${value} day${value === 1 ? "" : "s"}`;
};

const formatDateDisplay = (raw) => {
  if (!raw) {
    return "";
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toLocaleDateString();
};

const Profile = () => {
  const [profile, setProfile] = useState(initialProfile);

  const setField = (key) => (nextValue) =>
    setProfile((current) => ({
      ...current,
      [key]: nextValue,
    }));

  return (
    <main className="profile" role="main">
      <div className="profile__container">
        <header className="profile__header">
          <h1>Your Pregnancy Profile</h1>
          <p className="profile__subtitle">
            Keep these details up to date so Aya can personalize your journey.
          </p>
        </header>

        <section className="profile__inline">
          <InlineEditableField
            profileId={profile._id}
            field="name"
            label="Name"
            value={profile.name}
            parse={(next) => (typeof next === "string" ? next.trim() : next)}
            onSaved={setField("name")}
          />
          <InlineEditableField
            profileId={profile._id}
            field="weeks"
            label="Weeks"
            type="number"
            value={profile.weeks}
            format={formatWeeks}
            onSaved={setField("weeks")}
          />
          <InlineEditableField
            profileId={profile._id}
            field="days"
            label="Days"
            type="number"
            value={profile.days}
            format={formatDays}
            onSaved={setField("days")}
          />
          <InlineEditableField
            profileId={profile._id}
            field="dueDate"
            label="Estimated Due Date"
            type="date"
            value={profile.dueDate}
            parse={(raw) => new Date(raw).toISOString()}
            format={formatDateDisplay}
            onSaved={setField("dueDate")}
          />
          <InlineEditableField
            profileId={profile._id}
            field="frequency"
            label="Update Frequency"
            type="select"
            value={profile.frequency}
            options={frequencyOptions}
            format={(raw) => frequencyLabels[raw] || raw}
            onSaved={setField("frequency")}
          />
        </section>
      </div>
    </main>
  );
};

export default Profile;
