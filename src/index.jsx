import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App";
import { AuthGate } from "./AuthGate";
import { SpeedInsights } from "@vercel/speed-insights/react";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
    <SpeedInsights />
  </React.StrictMode>
);
