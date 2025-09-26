import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronDown, FiMoreVertical } from "react-icons/fi";
import styles from "./actionsMenu.styles.module.scss";

const ActionsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const location = useLocation();
  const wrapperRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className={styles.actions} ref={wrapperRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={toggleMenu}
      >
        <FiMoreVertical aria-hidden="true" focusable="false" />
        <span>Actions</span>
        <FiChevronDown aria-hidden="true" focusable="false" />
      </button>
      {isOpen && (
        <div className={styles.menu} role="menu" id={menuId}>
          <Link
            to="/chat"
            role="menuitem"
            className={styles.item}
            onClick={() => setIsOpen(false)}
          >
            Open Chat
          </Link>
          <Link
            to="/profile"
            role="menuitem"
            className={styles.item}
            onClick={() => setIsOpen(false)}
          >
            Edit Profile
          </Link>
        </div>
      )}
    </div>
  );
};

export default ActionsMenu;
