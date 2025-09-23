import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./sidebar.styles.module.scss";
import content from "../../content/appContent.json";
import { useCart } from "../../context/CartContext.jsx";

const navItems = [
  {
    id: "welcome",
    path: "/welcome",
  },
  {
    id: "dashboard",
    path: "/dashboard",
  },
  {
    id: "chat",
    path: "/chat",
  },
  {
    id: "store",
    path: "/store",
  },
  {
    id: "cart",
    path: "/cart",
  },
];

const Sidebar = ({ isOpen, onClose, onLogout, isLoggingOut }) => {
  const { cartCount } = useCart();
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
          {navItems.map((item) => (
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
