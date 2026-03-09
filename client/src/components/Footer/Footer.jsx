import React from "react";
import { Link } from "react-router-dom";
import "./footer.styles.scss";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Home", to: "/" },
      { label: "About", to: "/about" },
      { label: "Features", to: "/" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", to: "/login" },
      { label: "Register", to: "/register" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
    ],
  },
  {
    title: "Support",
    links: [{ label: "Contact", to: "/contact" }],
  },
];

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
        <div className="footer-brand-wrap">
          <p className="footer-brand">PregChat</p>
          <p className="footer-text">
            A calm, supportive pregnancy companion for every day of the
            journey.
          </p>
        </div>

        <div className="footer-link-groups" aria-label="Footer links">
          {footerGroups.map((group) => (
            <nav key={group.title} className="footer-link-group" aria-label={group.title}>
              <p>{group.title}</p>
              {group.links.map((link) => (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
