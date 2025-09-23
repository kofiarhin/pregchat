import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAppSelector } from "./store/store.js";
import { selectAuthToken } from "./store/ui/uiSlice.js";
import { useCurrentUserQuery } from "./features/auth/hooks/useAuth.js";
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import Welcome from "./pages/Welcome/Welcome.jsx";
import Onboarding from "./pages/Onboarding/Onboarding.jsx";
import Chat from "./pages/Chat.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";

const App = () => {
  const token = useAppSelector(selectAuthToken);
  const {
    data: currentUser,
    isLoading: userLoading,
  } = useCurrentUserQuery({
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
      <div className="app dark">
        {isAuthenticated && <Header />}
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to={isAuthenticated ? "/dashboard" : "/login"}
                replace
              />
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
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
            path="/chat"
            element={
              isAuthenticated ? <Chat /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/welcome"
            element={
              isAuthenticated ? <Welcome /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/onboarding"
            element={
              isAuthenticated ? (
                <Onboarding />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
        {isAuthenticated && <Footer />}
      </div>
    </BrowserRouter>
  );
};

export default App;
