import React from "react";
import { Outlet } from "react-router-dom";
import PublicHeader from "../../components/PublicHeader/PublicHeader.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import "./public-layout.styles.scss";

const PublicLayout = () => {
  return (
    <div className="public-layout">
      <PublicHeader />
      <main className="public-main" id="app-content">
        <Outlet />
      </main>
      <Footer variant="public" />
    </div>
  );
};

export default PublicLayout;
