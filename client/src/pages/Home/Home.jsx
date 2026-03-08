import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import "./home.styles.scss";

const FAQ_ITEMS = [
  {
    question: "Is PregChat only for pregnant women?",
    answer:
      "PregChat is designed primarily for expecting mothers, but supportive family members may also find it helpful.",
  },
  {
    question: "Can I track my pregnancy progress daily?",
    answer:
      "Yes. PregChat is designed to help users follow their pregnancy journey with day-by-day support and updates.",
  },
  {
    question: "Do I need medical knowledge to use it?",
    answer:
      "No. The experience is designed to be simple, clear, and easy to understand.",
  },
  {
    question: "Can I use PregChat on my phone?",
    answer:
      "Yes. The platform should feel smooth and accessible across devices.",
  },
  {
    question: "Is my information private?",
    answer:
      "PregChat is designed with a private, personal experience in mind.",
  },
];

const Home = () => {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="home-page">
      <section className="hero container">
        <div>
          <p className="kicker">A calm, supportive pregnancy companion</p>
          <h1>Your pregnancy companion, one chat away.</h1>
          <p className="hero-copy">
            Get daily pregnancy guidance, supportive answers, and a calm space
            to track your journey — all in one place.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/about" className="btn btn-ghost">
              Learn More
            </Link>
          </div>
          <p className="hero-microcopy">
            Built for expecting mothers who want simple, supportive, day-by-day
            pregnancy help.
          </p>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-device">
            <p className="hero-device-title">Today in PregChat</p>
            <p className="hero-device-text">
              Baby update: tiny growth, stronger heartbeat, and one step closer
              to meeting your little one.
            </p>
            <p className="hero-device-bubble">
              “I have a new symptom today — should I monitor it?”
            </p>
            <p className="hero-device-reply">
              Aya: I’m here with you. Let’s walk through what you’re feeling,
              and what to do next.
            </p>
          </div>
        </div>
      </section>

      <section className="trust-strip container">
        {[
          "Personalized pregnancy support",
          "Daily progress insights",
          "Calm, easy-to-use experience",
          "Designed for your motherhood journey",
        ].map((item) => (
          <article key={item} className="trust-card">
            {item}
          </article>
        ))}
      </section>

      <section className="content-section container">
        <h2>What is PregChat?</h2>
        <p>
          PregChat is a pregnancy-focused support platform designed to help
          expecting mothers stay informed, reassured, and connected throughout
          the journey. From daily baby development updates to guidance about the
          changes happening in your body, PregChat gives you a simple place to
          check in, learn, and feel supported.
        </p>
      </section>

      <section className="content-section container">
        <h2>Everything you need in one supportive space.</h2>
        <div className="feature-grid">
          <article className="feature-card"><h3>Daily Pregnancy Updates</h3><p>Follow your pregnancy day by day with simple, meaningful updates about your baby’s growth and your body’s changes.</p></article>
          <article className="feature-card"><h3>Chat-Based Guidance</h3><p>Ask questions in a natural way and get supportive, relevant answers when you need them.</p></article>
          <article className="feature-card"><h3>Personal Journey Tracking</h3><p>Keep your pregnancy experience organized with progress-based insights and personal check-ins.</p></article>
          <article className="feature-card"><h3>Calm, Private Experience</h3><p>A focused space designed to feel reassuring, simple, and easy to use.</p></article>
          <article className="feature-card"><h3>Journals and Reflections</h3><p>Capture your thoughts, milestones, and emotions throughout pregnancy.</p></article>
          <article className="feature-card"><h3>Appointments and Planning</h3><p>Stay on top of important moments, reminders, and next steps.</p></article>
        </div>
      </section>

      <section className="content-section container">
        <h2>Simple from the start.</h2>
        <div className="steps-grid">
          <article><span>Step 1</span><h3>Create your account</h3><p>Get started in minutes.</p></article>
          <article><span>Step 2</span><h3>Add your pregnancy details</h3><p>Help PregChat personalize your experience.</p></article>
          <article><span>Step 3</span><h3>Receive support every day</h3><p>Track progress, ask questions, and stay connected.</p></article>
        </div>
      </section>

      <section className="content-section container tone-panel">
        <h2>You do not have to figure it all out alone.</h2>
        <p>
          Pregnancy can bring excitement, questions, uncertainty, and change.
          PregChat gives you a supportive digital space where guidance feels
          easier to access and your journey feels easier to follow.
        </p>
      </section>

      <section className="content-section container">
        <h2>Who PregChat is for</h2>
        <ul className="who-list">
          <li>First-time moms looking for guidance</li>
          <li>Expecting mothers who want daily support</li>
          <li>Families who want a more organized pregnancy journey</li>
          <li>Anyone who wants a calmer, simpler way to stay informed</li>
        </ul>
      </section>

      <section className="content-section container">
        <h2>Frequently asked questions</h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <article key={item.question} className="faq-item">
                <button type="button" onClick={() => setOpenFaq(isOpen ? -1 : index)}>
                  <span>{item.question}</span>
                  <FaChevronDown className={isOpen ? "open" : ""} />
                </button>
                {isOpen && <p>{item.answer}</p>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-section container final-cta">
        <h2>Start your journey with PregChat today.</h2>
        <p>
          Create your account and experience a simpler, calmer way to stay
          connected throughout pregnancy.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary">Register</Link>
          <Link to="/login" className="btn btn-ghost">Login</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
