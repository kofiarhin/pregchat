import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/store";
import { logout } from "../../store/slices/authSlice";
import "./header.styles.scss";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__brand">
          <h1>PregChat</h1>
          <span className="header__subtitle">Your Pregnancy Guide</span>
        </div>

        <nav className="header__nav">
          <button
            className="header__menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className="hamburger"></span>
          </button>

          <ul
            className={`header__menu ${menuOpen ? "header__menu--open" : ""}`}
          >
            <li>
              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  isActive
                    ? "header__link header__link--active"
                    : "header__link"
                }
                onClick={() => setMenuOpen(false)}
              >
                Chat
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/welcome"
                className={({ isActive }) =>
                  isActive
                    ? "header__link header__link--active"
                    : "header__link"
                }
                onClick={() => setMenuOpen(false)}
              >
                Welcome
              </NavLink>
            </li>
            {user && (
              <li>
                <button onClick={handleLogout} className="header__logout-btn">
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
