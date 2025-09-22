import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useRegister } from "../hooks/useAuthQuery";

const registerStyles = {
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
    maxWidth: "420px",
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

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    region: "UK",
  });

  const registerMutation = useRegister();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <div style={registerStyles.wrapper}>
      <div style={registerStyles.card}>
        <div style={registerStyles.header}>
          <h1 style={registerStyles.title}>Create Your Account</h1>
          <p style={registerStyles.subtitle}>Join PregChat today</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={registerStyles.field}>
            <label htmlFor="name" style={registerStyles.label}>
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div style={registerStyles.field}>
            <label htmlFor="email" style={registerStyles.label}>
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

          <div style={registerStyles.field}>
            <label htmlFor="password" style={registerStyles.label}>
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

          <div style={{ ...registerStyles.field, marginBottom: "1.5rem" }}>
            <label htmlFor="region" style={registerStyles.label}>
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

          {registerMutation.isError && (
            <div style={registerStyles.error}>
              {registerMutation.error?.message}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            style={{ width: "100%", marginBottom: "1rem" }}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Loading..." : "Register"}
          </button>
        </form>

        <p style={registerStyles.cta}>
          Already have an account? {" "}
          <Link to="/login" style={registerStyles.link}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
