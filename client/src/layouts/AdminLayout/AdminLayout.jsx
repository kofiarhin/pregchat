import { NavLink, Outlet } from "react-router-dom";
import { useLogoutMutation } from "../../features/auth/hooks/useAuth.js";
import styles from "./admin-layout.module.scss";

const AdminLayout = () => {
  const logoutMutation = useLogoutMutation();

  const handleLogout = () => logoutMutation.mutate();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.brand}>
          PregChat <span className={styles.brandAccent}>Admin</span>
        </span>
        <nav className={styles.nav}>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive ? styles.navLinkActive : styles.navLink
            }
          >
            Dashboard
          </NavLink>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Signing out..." : "Logout"}
          </button>
        </nav>
      </header>
      <main className={styles.content} id="app-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
