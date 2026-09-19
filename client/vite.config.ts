import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { seoPrerender } from "./vite/seoPrerender";

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPrerender()],
  // playwright.config.ts runs a second dev server (analytics on) next to
  // the default one; separate dep-optimizer caches keep them from
  // overwriting each other's pre-bundled dependencies.
  cacheDir: process.env.VITE_CACHE_DIR ?? "node_modules/.vite",
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
