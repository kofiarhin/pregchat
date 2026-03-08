import React from "react";
import "./about.styles.scss";

const About = () => {
  return (
    <div className="about-page container">
      <section>
        <p className="about-kicker">About PregChat</p>
        <h1>A calmer way to feel supported through pregnancy.</h1>
        <p>
          PregChat is built to help expecting mothers feel informed and cared
          for day by day. We believe guidance should feel clear, supportive, and
          easy to access whenever questions come up.
        </p>
      </section>

      <section className="about-card-grid">
        <article>
          <h2>What PregChat is</h2>
          <p>
            PregChat brings together daily updates, supportive chat guidance,
            journals, and planning tools in one focused space for pregnancy.
          </p>
        </article>
        <article>
          <h2>Who it is for</h2>
          <p>
            It is designed primarily for expecting mothers and can also support
            partners or family members who want to follow the journey with care.
          </p>
        </article>
        <article>
          <h2>Our mission</h2>
          <p>
            To offer calm, simple, supportive pregnancy guidance that helps each
            day feel a little more manageable and a little more connected.
          </p>
        </article>
      </section>
    </div>
  );
};

export default About;
