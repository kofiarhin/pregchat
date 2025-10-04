import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import styles from "./sidebar.styles.module.scss";
import content from "../../content/appContent.json";
import { useCart } from "../../context/CartContext.jsx";
import { useCurrentUserQuery } from "../../features/auth/hooks/useAuth.js";

const NAV_ITEMS = [
  {
    id: "profile",
    path: "/profile",
  },
  {
    id: "dashboard",
    path: "/dashboard",
  },
  {
    id: "journals",
    path: "/journals",
  },
  {
    id: "chat",
    path: "/chat",
  },
  {
    id: "faceoff",
    path: "/faceoff",
  },
  {
    id: "store",
    path: "/store",
  },
  {
    id: "cart",
    path: "/cart",
  },
  {
    id: "bookAppointment",
    path: "/appointments",
  },
  {
    id: "myAppointments",
    path: "/appointments/mine",
  },
  {
    id: "admin",
    path: "/admin",
    requiresAdmin: true,
  },
];

const Sidebar = ({ isOpen, onClose, onLogout, isLoggingOut }) => {
  const { cartCount } = useCart();
  const { data: user } = useCurrentUserQuery();
  const items = useMemo(
    () => NAV_ITEMS.filter((item) => !item.requiresAdmin || user?.isAdmin === true),
    [user]
  );
  const handleNavigate = () => {
    if (onClose) {
      onClose();
    }
  };

  const renderBadge = (itemId) => {
    if (itemId !== "cart" || cartCount === 0) {
      return null;
    }

    return <span className={styles.badge}>{cartCount}</span>;
  };

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
      aria-hidden={!isOpen}
    >
      <div className={styles.header}>
        <span className={styles.title}>{content.navigation.title}</span>
        <button
          className={styles.closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          {content.navigation.close}
        </button>
      </div>
      <nav>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ""}`
                }
                onClick={handleNavigate}
              >
                <span>{content.navigation.links[item.id]}</span>
                {renderBadge(item.id)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.footer}>
        <button
          className={styles.logoutButton}
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut
            ? content.navigation.signingOut
            : content.navigation.logout}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
