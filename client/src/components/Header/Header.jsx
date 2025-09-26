import React, { useState } from "react";
import {
  useLogoutMutation,
  useCurrentUserQuery,
} from "../../features/auth/hooks/useAuth.js";
import "./header.styles.scss";
import { FaBars } from "react-icons/fa";
import AvatarDropdown from "../AvatarDropdown.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import { Link } from "react-router-dom";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: user } = useCurrentUserQuery();
  const logoutMutation = useLogoutMutation({
    onSuccess: () => {
      setMenuOpen(false);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMenu = () => setMenuOpen((value) => !value);
  const closeMenu = () => setMenuOpen(false);
  return (
    <header className="header" role="banner">
      <div className="topbar">
        <button
          className="menu_btn"
          onClick={toggleMenu}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <FaBars className="icon" />
        </button>

        <Link to="/chat" className="brand_wrap">
          <span className="brand">PregChat</span>
          <span className="model">alpha</span>
        </Link>

        <div className="actions">
          <AvatarDropdown
            avatar={user?.name?.[0]?.toUpperCase() || "P"}
            userId={user?._id}
          />
        </div>
      </div>

      <div
        className={`overlay ${menuOpen ? "show" : ""}`}
        onClick={closeMenu}
      />
      <Sidebar
        isOpen={menuOpen}
        onClose={closeMenu}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      />
    </header>
  );
};

export default Header;
