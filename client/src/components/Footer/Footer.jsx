import React from "react";
import "./footer.styles.scss";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          Created by{" "}
          <a
            href="https://github.com/kofiarhin"
            target="_blank"
            rel="noopener noreferrer"
          >
            Kofi Arhin
          </a>
        </p>
        <div className="social-links">
          <a
            href="https://github.com/kofiarhin"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            GitHub
          </a>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            Instagram
          </a>
          <a
            href="https://x.com/kwofiArhin"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
