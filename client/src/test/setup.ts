import "@testing-library/jest-dom/vitest";
// Must come before ../i18n so the language detector sees a working storage.
import "./localStorageShim";
import { beforeEach } from "vitest";
// Importing the real i18n module initializes the default instance
// (bundled resources, synchronous init) exactly as in production.
import i18n from "../i18n";

// jsdom implements neither of these. ScrollToTop calls them on every route
// change, and the scrollIntoView one runs inside a requestAnimationFrame that
// sometimes lands after the test that triggered it has already finished —
// vitest then fails the whole run with an unhandled error even though every
// test passed.
window.scrollTo = (() => {}) as typeof window.scrollTo;
Element.prototype.scrollIntoView = (() => {}) as typeof Element.prototype.scrollIntoView;

beforeEach(async () => {
  // Deterministic starting point for every test: English, empty storage.
  window.localStorage.clear();
  await i18n.changeLanguage("en");
});
