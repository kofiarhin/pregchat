import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAppSelector } from "./store/store.js";
import { selectAuthToken } from "./store/ui/uiSlice.js";
import { useCurrentUserQuery } from "./features/auth/hooks/useAuth.js";
import PublicLayout from "./layouts/PublicLayout/PublicLayout.jsx";
import AppLayout from "./layouts/AppLayout/AppLayout.jsx";
import AdminLayout from "./layouts/AdminLayout/AdminLayout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import OnboardingGuard from "./routes/OnboardingGuard.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";
import UserOnlyRoute from "./routes/UserOnlyRoute.jsx";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";
import Home from "./pages/Home/Home.jsx";
import About from "./pages/About/About.jsx";
import Privacy from "./pages/Privacy/Privacy.jsx";
import Terms from "./pages/Terms/Terms.jsx";
import Contact from "./pages/Contact/Contact.jsx";
import Profile from "./pages/Profile.jsx";
import Onboarding from "./pages/Onboarding/Onboarding.jsx";
import Chat from "./pages/Chat.jsx";
import FaceOffPage from "./pages/FaceOffPage.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Store from "./pages/Store/Store.jsx";
import ItemDetails from "./pages/ItemDetails/ItemDetails.jsx";
import Cart from "./pages/Cart/Cart.jsx";
import Checkout from "./pages/Checkout/Checkout.jsx";
import AppointmentBrowse from "./pages/AppointmentBrowse.jsx";
import AppointmentMidwife from "./pages/AppointmentMidwife.jsx";
import MyAppointments from "./pages/MyAppointments.jsx";
import JournalsList from "./pages/JournalsList.jsx";
import JournalForm from "./pages/JournalForm.jsx";
import JournalDetail from "./pages/JournalDetail.jsx";
import VoiceScreen from "./pages/VoiceScreen.jsx";

const AppShell = ({ isAuthenticated, currentUser }) => {
  const defaultDest = !isAuthenticated
    ? "/"
    : currentUser?.isAdmin === true
      ? "/admin"
      : "/dashboard";

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />

        <Route
          element={
            <PublicOnlyRoute
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
            />
          }
        >
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Route>

      <Route
        element={<ProtectedRoute isAuthenticated={isAuthenticated} redirectTo="/login" />}
      >
        {/* Admin portal */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* User portal */}
        <Route element={<UserOnlyRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/onboarding" element={<Onboarding />} />

            <Route element={<OnboardingGuard />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/voice" element={<VoiceScreen />} />
              <Route path="/faceoff" element={<FaceOffPage />} />
              <Route path="/store" element={<Store />} />
              <Route path="/store/:id" element={<ItemDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/appointments" element={<AppointmentBrowse />} />
              <Route path="/appointments/mine" element={<MyAppointments />} />
              <Route path="/appointments/:id" element={<AppointmentMidwife />} />
              <Route path="/journals" element={<JournalsList />} />
              <Route path="/journals/new" element={<JournalForm mode="create" />} />
              <Route path="/journals/:id" element={<JournalDetail />} />
              <Route path="/journals/:id/edit" element={<JournalForm mode="edit" />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/welcome" element={<Navigate to="/profile" replace />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to={defaultDest} replace />}
      />
    </Routes>
  );
};

const App = () => {
  const token = useAppSelector(selectAuthToken);
  const { data: currentUser, isLoading: userLoading } = useCurrentUserQuery({
    enabled: Boolean(token),
  });

  if (userLoading) {
    return (
      <div className="app dark">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div className="loading" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = Boolean(token && currentUser);

  return (
    <BrowserRouter>
      <AppShell isAuthenticated={isAuthenticated} currentUser={currentUser} />
    </BrowserRouter>
  );
};

export default App;
