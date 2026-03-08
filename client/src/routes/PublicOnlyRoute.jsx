import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PublicOnlyRoute = ({ isAuthenticated, redirectTo = "/dashboard" }) => {
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
