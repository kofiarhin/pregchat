import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../features/auth/hooks/useAuth.js";
import "./login.styles.scss";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loginMutation = useLoginMutation({
    onSuccess: ({ user }) => {
      if (user?.isAdmin === true) {
        navigate("/admin", { replace: true });
      } else {
        navigate(user?.onboardingCompletedAt ? "/dashboard" : "/onboarding", {
          replace: true,
        });
      }
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
    loginMutation.mutate(formData);
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <header className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue your PregChat journey.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">
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

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
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
            <div className="auth-error">{loginMutation.error?.message}</div>
          )}

          <button type="submit" className="btn auth-submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Loading..." : "Login"}
          </button>
        </form>

        <p className="auth-cta">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </section>
    </main>
  );
};

export default Login;
