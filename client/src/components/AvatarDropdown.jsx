import React, { useEffect, useRef, useState } from "react";
import styles from "./avatarDropdown.styles.module.scss";
import { useChatMessages } from "../features/messages/hooks/useChatMessages.js";

const AvatarDropdown = ({ avatar, userId }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const { clearMessages, isClearing } = useChatMessages();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleReset = async () => {
    const confirmed = window.confirm("Clear this chat history?");
    if (!confirmed) {
      return;
    }

    await clearMessages(userId);
    setOpen(false);
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
            onClick={handleReset}
            disabled={isClearing}
            title={isClearing ? "Clearing..." : "Reset Chat"}
          >
            {isClearing ? "Clearing..." : "Reset Chat"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AvatarDropdown;
