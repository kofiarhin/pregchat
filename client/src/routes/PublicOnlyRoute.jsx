import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PublicOnlyRoute = ({ isAuthenticated, currentUser }) => {
  // Token present but user not yet resolved — avoid flashing the public page
  if (!isAuthenticated && currentUser === undefined) {
    return <div className="loading" />;
  }

  if (isAuthenticated) {
    const dest = currentUser?.onboardingCompletedAt ? "/dashboard" : "/onboarding";
    return <Navigate to={dest} replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
