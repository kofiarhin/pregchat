import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUserQuery } from "../features/auth/hooks/useAuth.js";

const AdminRoute = () => {
  const { data: currentUser, isLoading } = useCurrentUserQuery();

  if (isLoading || !currentUser) return <div className="loading" />;

  if (currentUser.isAdmin !== true) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
