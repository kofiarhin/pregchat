import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import content from "../content/appContent.json";
import styles from "./register.styles.module.scss";
import { useRegisterMutation } from "../features/auth/hooks/useAuth.js";

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
      navigate("/chat");
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
    <main className={styles.wrapper}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>{registerCopy.title}</h1>
          <p className={styles.subtitle}>{registerCopy.subtitle}</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              {registerCopy.fields?.name}
            </label>
            <input
              className={styles.input}
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              {registerCopy.fields?.email}
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              {registerCopy.fields?.password}
            </label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="region">
              {registerCopy.fields?.region}
            </label>
            <select
              className={styles.input}
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

          {errorMessage && <div className={styles.error}>{errorMessage}</div>}

          <button className={styles.submit} type="submit" disabled={isSubmitting}>
            {isSubmitting ? registerCopy.loading : registerCopy.submit}
          </button>
        </form>

        <p className={styles.cta}>
          {registerCopy.loginPrompt} {" "}
          <Link className={styles.link} to="/login">
            {registerCopy.loginLink}
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Register;
