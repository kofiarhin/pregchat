import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../features/auth/hooks/useAuth.js";
import "./login.styles.scss";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "kofiarhin@gmail.com",
    password: "password",
  });

  const loginMutation = useLoginMutation({
    onSuccess: () => navigate("/chat", { replace: true }),
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
    <div className="login-wrapper">
      <div className="login-card">
        <header className="login-header">
          <h1 className="login-title">Welcome Back!</h1>
          <p className="login-subtitle">Sign in to PregChat</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email" className="form-label">
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

          <div className="form-field">
            <label htmlFor="password" className="form-label">
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
            <div className="form-error">{loginMutation.error?.message}</div>
          )}

          <button
            type="submit"
            className="btn"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Loading..." : "Login"}
          </button>
        </form>

        <p className="login-cta">
          Don't have an account?{" "}
          <Link to="/register" className="link">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
