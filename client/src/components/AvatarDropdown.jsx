import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./avatarDropdown.styles.module.scss";
import { useLogoutMutation } from "../features/auth/hooks/useAuth.js";

const AvatarDropdown = ({ avatar }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation({
    onSuccess: () => navigate("/login"),
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        className={styles.avatarBtn}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        type="button"
        title="Account"
      >
        {avatar || "P"}
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <button
            className={styles.dangerItem}
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isLoggingOut ? "Signing out..." : "Logout"}
          >
            {isLoggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AvatarDropdown;
