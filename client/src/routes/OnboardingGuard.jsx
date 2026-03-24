import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUserQuery } from "../features/auth/hooks/useAuth.js";

const OnboardingGuard = () => {
  const { data: currentUser } = useCurrentUserQuery();

  if (!currentUser) return <div className="loading" />;

  if (!currentUser.onboardingCompletedAt) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default OnboardingGuard;
