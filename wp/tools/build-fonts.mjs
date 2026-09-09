import fs from "node:fs";
const specs = [
  ["inter", "Inter", ["400", "500", "600", "700"]],
  ["manrope", "Manrope", ["700", "800"]],
];
let out = `/*
 * Self-hosted fonts (GDPR-safe: no Google Fonts CDN request).
 *
 * Generated from the @fontsource packages by wp/tools/build-fonts.mjs —
 * one block per weight the site actually renders:
 *   Manrope  700/800  headings (h1-h3, the 404 mark)
 *   Inter    400      body copy
 *   Inter    500/600  links, labels, buttons, <strong> lead-ins
 *   Inter    700      bold body text
 *
 * Every face keeps its unicode-range, so a German or English visitor never
 * downloads the Cyrillic subsets and a Ukrainian one does. Only .woff2 is
 * shipped (the React build also carried a .woff fallback; every browser
 * that runs this site supports woff2).
 */
`;
for (const [pkg, family, weights] of specs) {
  for (const weight of weights) {
    const css = fs.readFileSync(`node_modules/@fontsource/${pkg}/${weight}.css`, "utf8");
    out += css
      .replace(/, url\(\.\/files\/[^)]+\) format\('woff'\)/g, "")
      .replace(/url\(\.\/files\//g, "url(../fonts/")
      .replace(/font-family: '[^']+'/g, `font-family: '${family}'`);
  }
}
fs.writeFileSync("wp/themes/elcorix/src/fonts.css", out);
console.log("wrote", out.length, "bytes");
