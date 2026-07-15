import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import App from "./App";
import "./index.css";

// Optional privacy-friendly analytics (self-hosted Plausible/Umami — no
// cookies, no consent banner needed). Enabled only when both build-time
// variables are set; remember to allow the host in the CSP (SECURITY.md).
const analyticsSrc = import.meta.env.VITE_ANALYTICS_SRC as string | undefined;
const analyticsDomain = import.meta.env.VITE_ANALYTICS_DOMAIN as string | undefined;
if (analyticsSrc && analyticsDomain) {
  const script = document.createElement("script");
  script.src = analyticsSrc;
  script.defer = true;
  script.dataset.domain = analyticsDomain;
  document.head.appendChild(script);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
