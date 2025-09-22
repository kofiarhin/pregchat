import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "./store/store";
import { useMe } from "./hooks/useAuthQuery";
import { useGetToday } from "./hooks/usePregnancyQuery";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Welcome from "./pages/Welcome";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";

const App = () => {
  const { user, token } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((s) => s.theme);
  const { isLoading: userLoading } = useMe();
  useGetToday();

  // Show loading state
  if (userLoading) {
    return (
      <div className={`app ${mode}`}>
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
          <div className="loading"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = Boolean(token && user);

  return (
    <BrowserRouter>
      <div className={`app ${mode}`}>
        {isAuthenticated && <Header />}
        <Routes>
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/chat" : "/login"} replace />
            }
          />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/chat" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/chat" replace /> : <Register />
            }
          />
          <Route
            path="/chat"
            element={isAuthenticated ? <Chat /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/welcome"
            element={
              isAuthenticated ? <Welcome /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
        {isAuthenticated && <Footer />}
      </div>
    </BrowserRouter>
  );
};

export default App;
