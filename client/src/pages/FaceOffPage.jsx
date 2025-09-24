import React from "react";
import NameFaceOff from "../components/NameFaceOff/NameFaceOff.jsx";
import content from "../content/appContent.json";
import "./faceOffPage.styles.scss";

const FaceOffPage = () => (
  <main className="faceoff-page">
    <div className="faceoff-page__intro">
      <h1>{content.faceOff.title}</h1>
      <p>{content.faceOff.description}</p>
    </div>
    <NameFaceOff />
  </main>
);

export default FaceOffPage;
