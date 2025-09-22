import React from "react";
import { useAppSelector } from "../store/store";
import { useGetToday } from "../hooks/usePregnancyQuery";

const welcomeStyles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at top, #151515 0%, #080808 55%, #020202 100%)",
    padding: "2rem",
  },
  card: {
    background: "rgba(12, 12, 12, 0.92)",
    border: "1px solid #1f1f1f",
    padding: "3rem",
    borderRadius: "1rem",
    boxShadow: "0 20px 45px rgba(0, 0, 0, 0.6)",
    textAlign: "center",
    maxWidth: "600px",
    width: "100%",
    color: "#f3f4ff",
  },
  heading: { fontSize: "3rem", marginBottom: "1rem", color: "#f5f7ff" },
  subheading: { fontSize: "1.2rem", marginBottom: "2rem", color: "#9aa0a6" },
  introBlock: { marginBottom: "2rem", color: "#d0d3dc" },
  section: {
    background: "rgba(28, 32, 42, 0.8)",
    padding: "2rem",
    borderRadius: "0.75rem",
    marginTop: "2rem",
    border: "1px solid rgba(76, 139, 245, 0.22)",
    textAlign: "left",
    color: "#e6e8f1",
  },
  fallback: {
    background: "rgba(24, 24, 24, 0.85)",
    padding: "2rem",
    borderRadius: "0.75rem",
    marginTop: "2rem",
    border: "1px solid #1f1f1f",
    textAlign: "left",
    color: "#d0d3dc",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100px",
  },
};

const Welcome = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { data: todayData, isLoading: todayLoading } = useGetToday();

  return (
    <div style={welcomeStyles.wrapper}>
      <div style={welcomeStyles.card}>
        <h1 style={welcomeStyles.heading}>Welcome to PregChat!</h1>
        <p style={welcomeStyles.subheading}>Your Pregnancy Wellness Guide</p>

        {user && (
          <div style={welcomeStyles.introBlock}>
            <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              Hi {user.name}! I'm Aya, your pregnancy guide.
            </p>
            <p>Ask me anything about your pregnancy wellness journey!</p>
          </div>
        )}

        {todayLoading ? (
          <div style={welcomeStyles.loading}>
            <div className="loading"></div>
          </div>
        ) : todayData ? (
          <div style={welcomeStyles.section}>
            <h3 style={{ marginBottom: "0.75rem" }}>Today's Update</h3>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>Day {todayData.day}</strong>
            </p>
            <p style={{ marginBottom: "0.5rem" }}>{todayData.babyUpdate}</p>
            <p style={{ marginBottom: "0.75rem" }}>{todayData.momUpdate}</p>
            <p style={{ fontStyle: "italic", color: "#b5c2ff" }}>{todayData.tips}</p>
          </div>
        ) : (
          <div style={welcomeStyles.fallback}>
            <h3 style={{ marginBottom: "0.75rem" }}>Getting Started</h3>
            <p>Please set up your pregnancy profile to see daily updates.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Welcome;
