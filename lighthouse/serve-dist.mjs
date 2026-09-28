// Serves the built client (client/dist) the way docker/nginx.conf does, so
// Lighthouse measures the site as visitors get it rather than the Vite dev
// server: prerendered documents, gzip, and the production CSP.
//
//   node lighthouse/serve-dist.mjs            → http://localhost:4173
//   PORT=5000 node lighthouse/serve-dist.mjs
//
// What it mirrors from nginx, and why each one matters to the score:
// - `try_files $uri $uri/index.html =404` + `error_page 404 /404.html`
//   (every route has a prerendered file; nothing falls back to index.html).
// - gzip for the same types as `gzip_types` (+ text/html, always on in
//   nginx). Without it the lab run reports the bundle's raw size.
// - The Content-Security-Policy, read out of docker/nginx.conf itself so the
//   two can never drift: a CSP violation is a console error, and console
//   errors cost Best Practices points.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(repo, process.argv[2] ?? "client/dist");
const port = Number(process.env.PORT ?? 4173);

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error(`serve-dist: ${root} has no index.html — run \`npm run build -w client\` first`);
  process.exit(1);
}

const nginxConf = fs.readFileSync(path.join(repo, "docker/nginx.conf"), "utf8");
const csp = nginxConf.match(/add_header Content-Security-Policy "([^"]+)"/)?.[1];
if (!csp) {
  console.error("serve-dist: no Content-Security-Policy found in docker/nginx.conf");
  process.exit(1);
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".xml": "text/xml",
  ".txt": "text/plain",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
const compressible = /^(text\/|application\/(javascript|json|manifest\+json|xml)|image\/svg)/;

function fileFor(urlPath) {
  const rel = path.normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  const abs = path.join(root, rel);
  if (!abs.startsWith(root)) return null; // ../ traversal
  for (const candidate of [abs, path.join(abs, "index.html")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function send(req, res, status, file) {
  const type = types[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  let body = fs.readFileSync(file);
  const headers = {
    "Content-Type": type,
    "Content-Security-Policy": csp,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": type.startsWith("text/html") ? "no-cache" : "max-age=31536000",
    Vary: "Accept-Encoding",
  };
  if (
    compressible.test(type) &&
    body.length >= 1024 &&
    /\bgzip\b/.test(String(req.headers["accept-encoding"] ?? ""))
  ) {
    body = zlib.gzipSync(body, { level: 6 }); // nginx's gzip_comp_level default is 1; 6 is what most hosts use
    headers["Content-Encoding"] = "gzip";
  }
  headers["Content-Length"] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === "HEAD" ? undefined : body);
}

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    // Same as the nginx location: the map is build output, not content.
    const file = pathname === "/_redirects.map" ? null : fileFor(pathname);
    if (file) return send(req, res, 200, file);
    // /api/* would be proxied to Express in production; nothing on a page
    // load calls it, so a plain 404 is enough here.
    if (pathname.startsWith("/api/") || /\.[a-z0-9]+$/i.test(pathname)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("not found");
    }
    return send(req, res, 404, path.join(root, "404.html"));
  })
  .listen(port, () => {
    console.log(`serve-dist: ${root} on http://localhost:${port}`);
  });
