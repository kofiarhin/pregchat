import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import content from "../content/appContent.json";
import { useRegisterMutation } from "../features/auth/hooks/useAuth.js";
import "./login.styles.scss";

const regionOptions = [
  { value: "", label: "Select your region" },
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "Global", label: "Global" },
];

const Register = () => {
  const navigate = useNavigate();
  const registerCopy = content?.auth?.register ?? {};
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    region: "",
  });

  const registerMutation = useRegisterMutation({
    onSuccess: () => {
      navigate("/dashboard", { replace: true });
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
    registerMutation.mutate(formData);
  };

  const isSubmitting = registerMutation.isPending;
  const errorMessage = registerMutation.error?.message;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <header className="auth-header">
          <h1 className="auth-title">{registerCopy.title}</h1>
          <p className="auth-subtitle">{registerCopy.subtitle}</p>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="name">
              {registerCopy.fields?.name}
            </label>
            <input
              className="input"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              {registerCopy.fields?.email}
            </label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              {registerCopy.fields?.password}
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="region">
              {registerCopy.fields?.region}
            </label>
            <select
              className="input"
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
            >
              {regionOptions.map((option) => (
                <option key={option.value || "placeholder"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {errorMessage && <div className="auth-error">{errorMessage}</div>}

          <button className="btn auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? registerCopy.loading : registerCopy.submit}
          </button>
        </form>

        <p className="auth-cta">
          {registerCopy.loginPrompt} <Link to="/login">{registerCopy.loginLink}</Link>
        </p>
      </section>
    </main>
  );
};

export default Register;
