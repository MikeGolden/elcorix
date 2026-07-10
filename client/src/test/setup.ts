import "@testing-library/jest-dom/vitest";
// Must come before ../i18n so the language detector sees a working storage.
import "./localStorageShim";
import { beforeEach } from "vitest";
// Importing the real i18n module initializes the default instance
// (bundled resources, synchronous init) exactly as in production.
import i18n from "../i18n";

beforeEach(async () => {
  // Deterministic starting point for every test: English, empty storage.
  window.localStorage.clear();
  await i18n.changeLanguage("en");
});
