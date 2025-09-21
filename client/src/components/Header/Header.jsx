import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/store";
import { logout } from "../../store/slices/authSlice";
import { toggleTheme } from "../../store/slices/themeSlice";
import "./header.styles.scss";
import { FaBars } from "react-icons/fa";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((s) => s.theme);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
    setMenuOpen(false);
  };

  const toggleMenu = () => setMenuOpen((v) => !v);
  const closeMenu = () => setMenuOpen(false);
  const themeLabel = mode === "dark" ? "Light" : "Dark";

  return (
    <header className="header">
      <div className="topbar">
        <button
          className="menu_btn"
          onClick={toggleMenu}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <FaBars className="icon" />
        </button>

        <div className="brand_wrap">
          <span className="brand">PregChat</span>
          <span className="model">alpha</span>
        </div>

        <div className="actions">
          <button
            className="theme_btn"
            type="button"
            onClick={() => dispatch(toggleTheme())}
            aria-label="Toggle theme"
          >
            {themeLabel}
          </button>
          <div className="avatar">{user?.name?.[0]?.toUpperCase() || "P"}</div>
        </div>
      </div>

      <div
        className={`overlay ${menuOpen ? "show" : ""}`}
        onClick={closeMenu}
      />
      <nav className={`drawer ${menuOpen ? "open" : ""}`}>
        <div className="drawer_header">
          <span className="drawer_title">Menu</span>
          <button
            className="close_btn"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            Close
          </button>
        </div>
        <ul className="nav_list">
          <li>
            <NavLink to="/chat" className="link" onClick={closeMenu}>
              Chat
            </NavLink>
          </li>
          <li>
            <NavLink to="/welcome" className="link" onClick={closeMenu}>
              Welcome
            </NavLink>
          </li>
          {user && (
            <li>
              <button onClick={handleLogout} className="logout_btn">
                Logout
              </button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
