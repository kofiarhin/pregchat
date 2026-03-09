import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaChevronDown,
  FaHeart,
  FaLock,
  FaRegCalendarCheck,
  FaSeedling,
  FaComments,
  FaRegClipboard,
  FaMoon,
  FaBookOpen,
  FaCalendarAlt,
  FaChartLine,
  FaUserCheck,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import "./home.styles.scss";

const trustItems = [
  { icon: FaHeart, text: "Personalized daily guidance" },
  { icon: FaLock, text: "Private and secure experience" },
  { icon: FaUserCheck, text: "Built for expecting mothers" },
  { icon: FaMoon, text: "Simple, calm design" },
];

const coreFeatures = [
  {
    title: "Daily Pregnancy Updates",
    description:
      "Follow your baby’s growth and your body’s changes day by day.",
    icon: FaSeedling,
  },
  {
    title: "Chat-Based Guidance",
    description:
      "Ask questions naturally and get supportive, relevant answers.",
    icon: FaComments,
  },
  {
    title: "Personal Journey Tracking",
    description:
      "Keep notes, milestones, and check-ins organized in one place.",
    icon: FaRegClipboard,
  },
];

const secondaryFeatures = [
  { title: "Calm, Private Experience", icon: FaLock },
  { title: "Journals and Reflections", icon: FaBookOpen },
  { title: "Appointments and Planning", icon: FaCalendarAlt },
  { title: "Progress Insights", icon: FaChartLine },
  { title: "Personalized Check-Ins", icon: FaUserCheck },
  { title: "Supportive Daily Routine", icon: FaClock },
];

const audienceItems = [
  "First-time moms looking for reassurance",
  "Expecting mothers who want daily support",
  "Families who want a more organized journey",
  "Anyone who wants a calmer way to stay informed",
];

const faqItems = [
  {
    question: "What does PregChat help with?",
    answer:
      "PregChat brings daily pregnancy updates, symptom guidance, progress tracking, journaling, and planning tools into one clear experience.",
  },
  {
    question: "Can I use PregChat on my phone?",
    answer:
      "Yes. The experience is designed to work smoothly across mobile, tablet, and desktop so your updates stay accessible.",
  },
  {
    question: "Is my information private?",
    answer:
      "Yes. PregChat is designed as a personal space with privacy-first account access and clear data boundaries.",
  },
  {
    question: "How personalized are the daily updates?",
    answer:
      "Daily content adapts to your pregnancy timeline so the guidance and progress details feel relevant to your current stage.",
  },
  {
    question: "Can I track notes and appointments?",
    answer:
      "Absolutely. You can keep journals, milestones, and appointment planning together so your journey stays organized.",
  },
  {
    question: "Do I need to be at a specific stage of pregnancy to use it?",
    answer:
      "No. PregChat is useful from early pregnancy through later stages and helps you stay informed day by day.",
  },
];

const Home = () => {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="home-page">
      <section className="home-hero container">
        <div className="hero-copy-column">
          <p className="section-eyebrow">A calm, supportive pregnancy companion</p>
          <h1>Calm pregnancy support, personalized day by day.</h1>
          <p className="hero-description">
            Get daily baby updates, symptom guidance, journals, and planning
            tools in one private space.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="hero-btn hero-btn-primary">
              Get Started
            </Link>
            <Link to="/about" className="hero-btn hero-btn-secondary">
              Learn More
            </Link>
          </div>

          <div className="hero-points" aria-label="Trust highlights">
            <span>Private by design</span>
            <span>Daily personalized updates</span>
            <span>Simple progress tracking</span>
          </div>
        </div>

        <div className="hero-visual-column" aria-hidden="true">
          <div className="hero-main-screen">
            <p className="mockup-label">Today • Week 22</p>
            <h3>Your daily pregnancy update</h3>
            <p>
              Baby is developing stronger movement patterns today. A short
              evening check-in can help you notice changes with confidence.
            </p>
            <div className="screen-pills">
              <span>Body update</span>
              <span>Baby growth</span>
              <span>Daily tips</span>
            </div>
          </div>

          <div className="hero-chat-float">
            <p className="mockup-label">Chat with Aya</p>
            <p>
              “I noticed a new symptom today. Should I keep an eye on it?”
            </p>
            <small>Guidance delivered in a clear, reassuring tone.</small>
          </div>

          <div className="hero-progress-chip">
            <FaRegCalendarCheck />
            <span>Progress on track • Week 22</span>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-grid">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.text} className="trust-item">
                <span className="trust-icon">
                  <Icon />
                </span>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-block container">
        <p className="section-eyebrow">Core features</p>
        <h2>Everything you need for a calmer pregnancy journey</h2>
        <p className="section-intro">
          Built to keep information clear and your day-to-day experience focused.
        </p>

        <div className="core-features-grid">
          {coreFeatures.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="core-feature-card">
                <span className="feature-icon">
                  <Icon />
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-block section-surface">
        <div className="container showcase-grid">
          <div>
            <h2>See how PregChat supports each step of the journey</h2>
            <p className="section-intro">
              One connected product space for updates, guidance, and personal
              organization.
            </p>
            <ul className="showcase-list">
              <li>Daily baby and body updates</li>
              <li>Easy symptom conversations</li>
              <li>Private journaling and progress tracking</li>
            </ul>
          </div>

          <div className="showcase-mockups" aria-hidden="true">
            <article className="showcase-card showcase-dashboard">
              <p className="mockup-label">Daily dashboard</p>
              <h4>Week summary</h4>
              <p>Growth insights, daily tips, and routine reminders.</p>
            </article>
            <article className="showcase-card showcase-chat">
              <p className="mockup-label">Chat support</p>
              <p>“Can you summarize today’s key check-ins?”</p>
            </article>
            <article className="showcase-card showcase-journal">
              <p className="mockup-label">Journal</p>
              <p>Saved note: Evening reflection and symptom log.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-block container">
        <h2>Designed to support real everyday needs</h2>
        <div className="secondary-features-grid">
          {secondaryFeatures.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="secondary-feature-card">
                <span className="secondary-icon">
                  <Icon />
                </span>
                <h3>{item.title}</h3>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-block section-surface-soft">
        <div className="container">
          <h2>Simple from the start</h2>
          <div className="steps-grid">
            {[
              {
                number: "01",
                title: "Create your account",
                text: "Get started in minutes.",
              },
              {
                number: "02",
                title: "Add your pregnancy details",
                text: "Help PregChat personalize your daily experience.",
              },
              {
                number: "03",
                title: "Receive support every day",
                text: "Track progress, ask questions, and stay connected.",
              },
            ].map((step) => (
              <article key={step.number} className="step-card">
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block container">
        <article className="reassurance-panel">
          <div>
            <h2>You do not have to figure it all out alone</h2>
            <p>
              Pregnancy brings change, questions, and uncertainty. PregChat
              gives you a calm digital space for guidance, tracking, and
              support.
            </p>
          </div>
          <div className="reassurance-grid">
            <article>
              <h3>Private and personal</h3>
              <p>A space designed to feel safe and focused.</p>
            </article>
            <article>
              <h3>Day-by-day support</h3>
              <p>Daily updates that make progress easier to follow.</p>
            </article>
            <article>
              <h3>Built to reduce overwhelm</h3>
              <p>Clear guidance without clutter or noise.</p>
            </article>
          </div>
        </article>
      </section>

      <section className="section-block container">
        <h2>Who PregChat is for</h2>
        <p className="section-intro">
          Designed for people who want reassurance and better daily structure.
        </p>
        <div className="audience-grid">
          {audienceItems.map((item) => (
            <article key={item} className="audience-card">
              <FaCheckCircle />
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block faq-section">
        <div className="container faq-inner">
          <h2>Frequently asked questions</h2>
          <p className="section-intro">
            Quick answers before you get started.
          </p>
          <div className="faq-list">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <article key={item.question} className={`faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="faq-trigger"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <FaChevronDown />
                  </button>
                  <div className="faq-answer-wrap">
                    <p>{item.answer}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-block container">
        <div className="final-cta-panel">
          <h2>Start your pregnancy journey with calm, personalized support</h2>
          <p>
            Create your account and begin receiving daily updates, guidance, and
            progress tools in one private space.
          </p>
          <Link to="/register" className="hero-btn hero-btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="final-cta-link">
            Already have an account? Log in
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
