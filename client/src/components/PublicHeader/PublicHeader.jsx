import React, { useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { useCurrentUserQuery } from "../../features/auth/hooks/useAuth.js";
import { useAppSelector } from "../../store/store.js";
import { selectAuthToken } from "../../store/ui/uiSlice.js";
import "./public-header.styles.scss";

const guestLinks = [
  { id: "home", label: "Home", path: "/" },
  { id: "about", label: "About", path: "/about" },
  { id: "login", label: "Login", path: "/login", subtle: true },
  { id: "register", label: "Get Started", path: "/register", cta: true },
];

const userLinks = [
  { id: "home", label: "Home", path: "/" },
  { id: "dashboard", label: "Dashboard", path: "/dashboard" },
  { id: "chat", label: "Chat", path: "/chat" },
  { id: "about", label: "About", path: "/about" },
];

const adminLinks = [
  { id: "home", label: "Home", path: "/" },
  { id: "admin", label: "Admin Dashboard", path: "/admin" },
  { id: "about", label: "About", path: "/about" },
];

const PublicHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const token = useAppSelector(selectAuthToken);
  const { data: user } = useCurrentUserQuery();
  const isLoggedIn = Boolean(token && user);

  const navLinks = isLoggedIn
    ? (user?.isAdmin === true ? adminLinks : userLinks)
    : guestLinks;
  const mobileLinks = useMemo(() => navLinks, [isLoggedIn]);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  React.useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  return (
    <header className="public-header" role="banner">
      <div className="public-header-inner container">
        <Link to="/" className="public-brand" aria-label="PregChat home">
          <span className="brand-dot" />
          PregChat
        </Link>

        <nav className="public-nav" aria-label="Public">
          {navLinks.map((link) => (
            <NavLink
              key={link.id}
              to={link.path}
              className={({ isActive }) =>
                `public-nav-link ${isActive ? "active" : ""} ${
                  link.cta ? "public-nav-cta" : ""
                } ${link.subtle ? "public-nav-subtle" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="public-menu-btn"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
          aria-controls="public-mobile-nav"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <div
        className={`public-overlay ${isMenuOpen ? "show" : ""}`}
        role="presentation"
        onClick={closeMenu}
      />

      <aside
        id="public-mobile-nav"
        className={`public-mobile-nav ${isMenuOpen ? "open" : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <p className="public-mobile-title">Navigation</p>
        <nav aria-label="Mobile public navigation">
          {mobileLinks.map((link) => (
            <NavLink
              key={link.id}
              to={link.path}
              className={({ isActive }) =>
                `public-mobile-link ${isActive ? "active" : ""} ${
                  link.cta ? "public-mobile-cta" : ""
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </header>
  );
};

export default PublicHeader;
