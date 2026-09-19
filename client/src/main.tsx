import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import App from "./App";
import { initAnalytics } from "./analytics";
import "./index.css";

// Self-hosted, cookie-free Umami — only when the build has a website id
// (VITE_UMAMI_WEBSITE_ID). See src/analytics.ts.
initAnalytics(import.meta.env);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
