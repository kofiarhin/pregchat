import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";

const AppLayout = () => {
  const location = useLocation();
  const hideChrome = location.pathname === "/voice";

  return (
    <div className="app dark">
      {!hideChrome && <Header />}
      <Outlet />
      {!hideChrome && <Footer variant="app" />}
    </div>
  );
};

export default AppLayout;
