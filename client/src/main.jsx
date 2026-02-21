// src/main.jsx (or src/index.js based on your setup)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Make sure this file exists or remove this line
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);