import React from "react";
import { useAuth } from "@clerk/clerk-react";
import "./home.styles.scss";
const Home = () => {
  const { user } = useAuth();
  return (
    <div id="home">
      <h1>Testing Mic</h1>{" "}
      {user ? <p> user details here</p> : <p> pleade log in</p>}{" "}
    </div>
  );
};

export default Home;
