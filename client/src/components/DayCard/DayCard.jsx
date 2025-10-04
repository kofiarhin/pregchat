import React from "react";
import "./dayCard.styles.scss";

const DayCard = ({ day, babyUpdate, momUpdate, tips }) => {
  return (
    <div className="day-card">
      <div className="day-card__header">
        <h2 className="day-card__title">Day {day}</h2>
        <span className="day-card__subtitle">Your pregnancy update</span>
      </div>

      <div className="day-card__content">
        <div className="day-card__section">
          <h3 className="day-card__section-title">Baby Update</h3>
          <p className="day-card__text">{babyUpdate}</p>
        </div>

        <div className="day-card__section">
          <h3 className="day-card__section-title">Parent Update</h3>
          <p className="day-card__text">{momUpdate}</p>
        </div>

        <div className="day-card__section">
          <h3 className="day-card__section-title">Daily Tips</h3>
          <p className="day-card__text">{tips}</p>
        </div>
      </div>

      <div className="day-card__footer">
        <div className="day-card__warning">
          <span className="day-card__warning-icon">!</span>
          <span className="day-card__warning-text">
            If you experience severe symptoms, contact emergency services immediately.
          </span>
        </div>
      </div>
    </div>
  );
};

export default DayCard;
