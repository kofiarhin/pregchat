import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUserQuery } from "../features/auth/hooks/useAuth.js";

const UserOnlyRoute = () => {
  const { data: currentUser, isLoading } = useCurrentUserQuery();

  if (isLoading || !currentUser) return <div className="loading" />;

  if (currentUser.isAdmin === true) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default UserOnlyRoute;
