import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../features/auth/hooks/useAuth.js";

const loginStyles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at top, #181818 0%, #090909 55%, #020202 100%)",
    padding: "1rem",
  },
  card: {
    background: "#141414",
    border: "1px solid #1f1f1f",
    padding: "2rem",
    borderRadius: "1rem",
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.55)",
    width: "100%",
    maxWidth: "400px",
  },
  header: { textAlign: "center", marginBottom: "2rem" },
  title: { color: "#f5f7ff", marginBottom: "0.5rem" },
  subtitle: { color: "#a0a5b4", marginBottom: "0.5rem" },
  field: { marginBottom: "1rem" },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "500",
    color: "#d0d3dc",
  },
  error: {
    background: "#3a1212",
    color: "#ffd6d6",
    padding: "0.75rem",
    borderRadius: "0.25rem",
    marginBottom: "1rem",
    fontSize: "0.875rem",
    border: "1px solid #5b1c1c",
  },
  cta: {
    textAlign: "center",
    fontSize: "0.875rem",
    color: "#9aa0a6",
  },
  link: { color: "#4c8bf5" },
};

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loginMutation = useLoginMutation({
    onSuccess: () => {
      navigate("/dashboard");
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <div style={loginStyles.wrapper}>
      <div style={loginStyles.card}>
        <div style={loginStyles.header}>
          <h1 style={loginStyles.title}>Welcome Back</h1>
          <p style={loginStyles.subtitle}>Sign in to PregChat</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={loginStyles.field}>
            <label htmlFor="email" style={loginStyles.label}>
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

          <div style={{ ...loginStyles.field, marginBottom: "1.5rem" }}>
            <label htmlFor="password" style={loginStyles.label}>
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

          {loginMutation.isError && (
            <div style={loginStyles.error}>
              {loginMutation.error?.message}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            style={{ width: "100%", marginBottom: "1rem" }}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Loading..." : "Login"}
          </button>
        </form>

        <p style={loginStyles.cta}>
          Don't have an account? {" "}
          <Link to="/register" style={loginStyles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
