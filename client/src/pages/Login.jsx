import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLogin } from "../hooks/useAuthQuery";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loginMutation = useLogin();

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
          <h1 style={{ color: "#667eea", marginBottom: "0.5rem" }}>
            Welcome Back
          </h1>
          <p style={{ color: "#666", marginBottom: "0.5rem" }}>
            Sign in to PregChat
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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

          <div style={{ marginBottom: "1.5rem" }}>
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

          {loginMutation.isError && (
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

        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "#555",
          }}
        >
          Don't have an account? {" "}
          <Link to="/register" style={{ color: "#667eea" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
