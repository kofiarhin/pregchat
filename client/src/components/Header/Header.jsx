import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  useLogoutMutation,
  useCurrentUserQuery,
} from "../../features/auth/hooks/useAuth.js";
import "./header.styles.scss";
import { FaBars } from "react-icons/fa";
import AvatarDropdown from "../AvatarDropdown.jsx";
import { useChatSession } from "../../features/chats/context/ChatSessionContext.jsx";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: user } = useCurrentUserQuery();
  const { messagesSetter } = useChatSession();
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

        <div className="brand_wrap">
          <span className="brand">PregChat</span>
          <span className="model">alpha</span>
        </div>

        <div className="actions">
          <AvatarDropdown
            avatar={user?.name?.[0]?.toUpperCase() || "P"}
            setMessages={messagesSetter}
            userId={user?._id}
          />
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
            <NavLink to="/welcome" className="link" onClick={closeMenu}>
              Welcome
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" className="link" onClick={closeMenu}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/chat" className="link" onClick={closeMenu}>
              Chat
            </NavLink>
          </li>

          {user && (
            <li>
              <button
                onClick={handleLogout}
                className="logout_btn"
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Signing out..." : "Logout"}
              </button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
