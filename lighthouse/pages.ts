import path from "node:path";

/** The pages Lighthouse audits — shared by global-setup.ts and the spec. */
export const PAGES = [
  // What PageSpeed Insights measures for https://elcorix.com: the German
  // document at /, redirected client-side to the browser's language
  // (English, in Lighthouse's Chrome).
  { name: "root", path: "/" },
  { name: "home-de", path: "/de" },
  { name: "prices-de", path: "/de/preise" },
] as const;

export type PageName = (typeof PAGES)[number]["name"];

export const REPORT_DIR = path.resolve("lighthouse-reports");

export const reportPath = (name: PageName, ext: "json" | "html") =>
  path.join(REPORT_DIR, `${name}.${ext}`);
