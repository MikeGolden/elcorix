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

const container = document.getElementById("root")!;
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// The build renders every page into its shell (src/entry-server.tsx), so
// in production the container already holds the page and React only has
// to adopt it — no second render, no flash of the layout being rebuilt.
// `npm run dev` serves the bare index.html, where there is nothing to
// adopt and this falls back to a normal client render.
if (container.firstElementChild) {
  ReactDOM.hydrateRoot(container, app);
} else {
  ReactDOM.createRoot(container).render(app);
}
