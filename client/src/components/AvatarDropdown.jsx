import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./avatarDropdown.styles.module.scss";
import { useLogoutMutation } from "../features/auth/hooks/useAuth.js";
import { useCreateChatMutation } from "../features/chats/hooks/useCreateChatMutation.js";

const AvatarDropdown = ({ avatar }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation({
    onSuccess: () => navigate("/login"),
  });

  const { mutate: createChat, isPending: isCreating } = useCreateChatMutation({
    onSuccess: (chat) => {
      setOpen(false);
      if (location.pathname === "/chat") {
        window.dispatchEvent(
          new CustomEvent("pregchat:switch-thread", { detail: { id: chat?.id } })
        );
      } else {
        navigate("/chat");
      }
    },
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

  const handleNewChat = () => {
    createChat({});
  };

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
            className={styles.menuItem}
            type="button"
            role="menuitem"
            onClick={handleNewChat}
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "New Chat"}
          </button>
          <button
            className={styles.dangerItem}
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AvatarDropdown;
