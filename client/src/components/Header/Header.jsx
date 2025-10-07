import React, { useEffect, useMemo, useState } from "react";
import {
  useLogoutMutation,
  useCurrentUserQuery,
} from "../../features/auth/hooks/useAuth.js";
import "./header.styles.scss";
import { FaBars, FaPlus } from "react-icons/fa";
import AvatarDropdown from "../AvatarDropdown.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isElevated, setIsElevated] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const { data: user } = useCurrentUserQuery();
  const logoutMutation = useLogoutMutation({
    onSuccess: () => setMenuOpen(false),
  });

  const location = useLocation();

  const userInitial = useMemo(
    () => user?.name?.[0]?.toUpperCase() || "P",
    [user]
  );

  const handleLogout = () => logoutMutation.mutate();
  const toggleMenu = () => setMenuOpen((v) => !v);
  const closeMenu = () => setMenuOpen(false);
  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent("pregchat:clear-chat"));
  };

  // Close menu on route change
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  // Elevation on scroll
  useEffect(() => {
    const onScroll = () => setIsElevated(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Esc to close menu
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    if (menuOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Online/offline indicator
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <header className={`header ${isElevated ? "elevated" : ""}`} role="banner">
      <a href="#app-content" className="skip-link">
        Skip to content
      </a>

      <div className="topbar" role="navigation" aria-label="Main">
        {/* Left: Menu */}
        <button
          id="menu-trigger"
          className="menu_btn"
          onClick={toggleMenu}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
        >
          <FaBars className="icon" />
        </button>

        {/* Center: Brand + alpha pill */}
        <Link to="/chat" className="brand_wrap" aria-label="Go to chat">
          <span className="brand">Aya</span>
          <span className="separator">·</span>
          <span>PregChat</span>
          <span
            className="model"
            role="button"
            tabIndex={0}
            title="What’s new"
            onClick={(e) => {
              e.preventDefault();
              // You can hook this to open your changelog modal
            }}
          >
            alpha
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="actions">
          {/* <button
            type="button"
            className="action_btn new_chat"
            aria-label="New chat"
            onClick={handleNewChat}
          >
            <FaPlus />
            <span className="label">New Chat</span>
          </button> */}

          <div
            className="avatar_wrap"
            data-online={isOnline ? "true" : "false"}
          >
            <AvatarDropdown avatar={userInitial} userId={user?._id} />
            <span className="status_dot" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`overlay ${menuOpen ? "show" : ""}`}
        role="presentation"
        onClick={closeMenu}
      />

      {/* Sidebar */}
      <Sidebar
        id="app-sidebar"
        isOpen={menuOpen}
        onClose={closeMenu}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      />
    </header>
  );
};

export default Header;
