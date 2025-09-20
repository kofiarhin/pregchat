import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "./store/store";
import { useMe, useLogin, useRegister } from "./hooks/useAuthQuery";
import Header from "./components/Header/Header";
import DayCard from "./components/DayCard/DayCard";
import ChatBox from "./components/ChatBox/ChatBox";
import { useGetToday } from "./hooks/usePregnancyQuery";
import Welcome from "./pages/Welcome";
import Chat from "./pages/Chat";
import Footer from "./components/Footer/Footer";

const App = () => {
  const { user, token } = useAppSelector((state) => state.auth);
  const { dayIndex } = useAppSelector((state) => state.pregnancy);
  const { data: userData, isLoading: userLoading } = useMe();
  const { data: todayData, isLoading: todayLoading } = useGetToday();

  // Show loading state
  if (userLoading) {
    return (
      <div className="app">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div className="loading"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!token || !user) {
    return (
      <div className="app">
        <AuthScreen />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/welcome" element={<Welcome />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

// Simple auth screen component
const AuthScreen = () => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    region: "UK",
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    } else {
      registerMutation.mutate(formData);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "1rem",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ color: "#667eea", marginBottom: "0.5rem" }}>PregChat</h1>
          <p style={{ color: "#666" }}>Your Pregnancy Wellness Guide</p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required={!isLogin}
              />
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="region"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                Region
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="input"
              >
                <option value="UK">United Kingdom</option>
                <option value="US">United States</option>
                <option value="Global">Global</option>
              </select>
            </div>
          )}

          {(loginMutation.isError || registerMutation.isError) && (
            <div
              style={{
                background: "#f8d7da",
                color: "#721c24",
                padding: "0.75rem",
                borderRadius: "0.25rem",
                marginBottom: "1rem",
                fontSize: "0.875rem",
              }}
            >
              {loginMutation.error?.message || registerMutation.error?.message}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            style={{ width: "100%", marginBottom: "1rem" }}
            disabled={loginMutation.isPending || registerMutation.isPending}
          >
            {loginMutation.isPending || registerMutation.isPending
              ? "Loading..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              cursor: "pointer",
              width: "100%",
              fontSize: "0.875rem",
            }}
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
