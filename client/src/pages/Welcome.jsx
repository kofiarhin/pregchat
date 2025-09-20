import React from "react";
import { useAppSelector } from "../store/store";
import { useGetToday } from "../hooks/usePregnancyQuery";

const Welcome = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { data: todayData, isLoading: todayLoading } = useGetToday();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          padding: "3rem",
          borderRadius: "1rem",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
          maxWidth: "600px",
          width: "100%",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "white" }}>
          Welcome to PregChat!
        </h1>
        <p style={{ fontSize: "1.2rem", marginBottom: "2rem", opacity: "0.9" }}>
          Your Pregnancy Wellness Guide
        </p>

        {user && (
          <div style={{ marginBottom: "2rem" }}>
            <p style={{ fontSize: "1.1rem" }}>
              👋 Hi {user.name}! I'm Aya, your pregnancy guide.
            </p>
            <p>Ask me anything about your pregnancy wellness journey!</p>
          </div>
        )}

        {todayLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100px",
            }}
          >
            <div className="loading"></div>
          </div>
        ) : todayData ? (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              padding: "2rem",
              borderRadius: "0.5rem",
              marginTop: "2rem",
            }}
          >
            <h3>Today's Update</h3>
            <p>
              <strong>Day {todayData.day}</strong>
            </p>
            <p>{todayData.babyUpdate}</p>
            <p>{todayData.momUpdate}</p>
            <p>
              <em>{todayData.tips}</em>
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              padding: "2rem",
              borderRadius: "0.5rem",
              marginTop: "2rem",
            }}
          >
            <h3>Getting Started</h3>
            <p>Please set up your pregnancy profile to see daily updates.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Welcome;
