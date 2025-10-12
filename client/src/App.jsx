import React from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useAppSelector } from "./store/store.js";
import { selectAuthToken } from "./store/ui/uiSlice.js";
import { useCurrentUserQuery } from "./features/auth/hooks/useAuth.js";
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
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

const AppShell = ({ isAuthenticated }) => {
  const location = useLocation();
  const hideChrome = location.pathname === "/voice";

  return (
    <div className="app dark">
      {isAuthenticated && !hideChrome && <Header />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/chat" replace /> : <Login />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/admin"
          element={
            isAuthenticated ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/chat"
          element={
            isAuthenticated ? <Chat /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/voice"
          element={
            isAuthenticated ? <VoiceScreen /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/faceoff"
          element={
            isAuthenticated ? <FaceOffPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/store"
          element={
            isAuthenticated ? <Store /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/store/:id"
          element={
            isAuthenticated ? <ItemDetails /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/cart"
          element={
            isAuthenticated ? <Cart /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/checkout"
          element={
            isAuthenticated ? <Checkout /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/appointments"
          element={
            isAuthenticated ? (
              <AppointmentBrowse />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/appointments/mine"
          element={
            isAuthenticated ? (
              <MyAppointments />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/journals"
          element={
            isAuthenticated ? (
              <JournalsList />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/journals/new"
          element={
            isAuthenticated ? (
              <JournalForm mode="create" />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/journals/:id"
          element={
            isAuthenticated ? (
              <JournalDetail />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/journals/:id/edit"
          element={
            isAuthenticated ? (
              <JournalForm mode="edit" />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/appointments/:id"
          element={
            isAuthenticated ? (
              <AppointmentMidwife />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? <Profile /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/welcome" element={<Navigate to="/profile" replace />} />
        <Route
          path="/onboarding"
          element={
            isAuthenticated ? <Onboarding /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
      {isAuthenticated && !hideChrome && <Footer />}
    </div>
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
      <AppShell isAuthenticated={isAuthenticated} />
    </BrowserRouter>
  );
};

export default App;
