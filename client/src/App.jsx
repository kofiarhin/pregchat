import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
            path="/faceoff"
            element={
              isAuthenticated ? (
                <FaceOffPage />
              ) : (
                <Navigate to="/login" replace />
              )
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
              isAuthenticated ? (
                <ItemDetails />
              ) : (
                <Navigate to="/login" replace />
              )
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

// Simple auth screen component
const AuthScreen = () => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    region: "UK",
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    } else {
      registerMutation.mutate(formData);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "1rem",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ color: "#667eea", marginBottom: "0.5rem" }}>PregChat</h1>
          <p style={{ color: "#666" }}>Your Pregnancy Wellness Guide</p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required={!isLogin}
              />
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="region"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                Region
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="input"
              >
                <option value="UK">United Kingdom</option>
                <option value="US">United States</option>
                <option value="Global">Global</option>
              </select>
            </div>
          )}

          {(loginMutation.isError || registerMutation.isError) && (
            <div
              style={{
                background: "#f8d7da",
                color: "#721c24",
                padding: "0.75rem",
                borderRadius: "0.25rem",
                marginBottom: "1rem",
                fontSize: "0.875rem",
              }}
            >
              {loginMutation.error?.message || registerMutation.error?.message}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            style={{ width: "100%", marginBottom: "1rem" }}
            disabled={loginMutation.isPending || registerMutation.isPending}
          >
            {loginMutation.isPending || registerMutation.isPending
              ? "Loading..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              cursor: "pointer",
              width: "100%",
              fontSize: "0.875rem",
            }}
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
