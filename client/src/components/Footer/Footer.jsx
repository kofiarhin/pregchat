import React from "react";
import { Link } from "react-router-dom";
import "./footer.styles.scss";

const Footer = ({ variant = "public" }) => {
  if (variant === "app") {
    return (
      <footer className="footer app-footer">
        <div className="footer-content container">
          <p className="footer-text">
            PregChat · Educational support only — not a diagnosis.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer public-footer">
      <div className="footer-content container">
        <div>
          <p className="footer-brand">PregChat</p>
          <p className="footer-text">
            A calm, supportive pregnancy companion for every day of your
            journey.
          </p>
        </div>

        <nav className="footer-links" aria-label="Footer links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
