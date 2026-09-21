import worker from "./_worker.js";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../cloudflare", import.meta.url).pathname;

const ASSETS = {
  async fetch(req) {
    // Cloudflare hands the worker a decoded path; the Cyrillic slugs
    // (/uk/ціни) arrive percent-encoded from the client.
    const p = decodeURIComponent(new URL(req.url).pathname);
    for (const cand of [p, join(p, "index.html")]) {
      const f = join(ROOT, cand);
      if (existsSync(f) && !f.endsWith("/")) {
        try {
          const body = await readFile(f);
          return new Response(body, { status: 200, headers: { "content-type": cand.endsWith(".html") ? "text/html" : "application/octet-stream" } });
        } catch {}
      }
    }
    return new Response("not found", { status: 404 });
  },
};

let sent = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).includes("api.telegram.org")) {
    sent.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
  return realFetch(url, init);
};

const env = { TELEGRAM_BOT_TOKEN: "123456789:" + "A".repeat(25), TELEGRAM_CHAT_ID: "-100123456", ASSETS };
const ctx = { waitUntil() {} };
const get = (p) => worker.fetch(new Request("https://x.test" + p), env, ctx);
const post = (p, body) => worker.fetch(new Request("https://x.test" + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), env, ctx);

let fails = 0;
const check = async (name, fn) => {
  try { await fn(); console.log("  ok  " + name); }
  catch (e) { fails++; console.log("FAIL  " + name + " — " + e.message); }
};
const eq = (a, b, what) => { if (a !== b) throw new Error(`${what}: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`); };

await check("GET / serves the root shell", async () => {
  const r = await get("/");
  eq(r.status, 200, "status");
  eq(r.headers.get("cache-control"), "public, max-age=0, must-revalidate", "cache");
  eq(r.headers.get("x-content-type-options"), "nosniff", "nosniff");
  if (!(await r.text()).includes("elcorix")) throw new Error("no body");
});
await check("GET /de/preise/ serves the prerendered shell", async () => {
  const r = await get("/de/preise/");
  eq(r.status, 200, "status");
  const html = await r.text();
  if (!html.includes('canonical" href="https://elcorix.de/de/preise"')) throw new Error("wrong shell");
});
await check("GET /uk/контакти serves the Ukrainian shell", async () => {
  const html = await (await get("/uk/" + encodeURIComponent("контакти"))).text();
  if (!html.includes('<html lang="uk"')) throw new Error("wrong lang");
});
await check("unknown URL answers 404 with the noindex document", async () => {
  const r = await get("/de/does-not-exist");
  eq(r.status, 404, "status");
  const html = await r.text();
  if (!html.includes("/assets/")) throw new Error("not the app document");
  if (!html.includes('name="robots"')) throw new Error("not marked noindex");
});
await check("the redirect map is not served", async () =>
  eq((await get("/_redirects.map")).status, 404, "status"));
await check("hashed assets are immutable", async () => {
  // Read the name out of the build rather than pinning a hash that
  // changes with every bundle.
  const shell = await readFile(join(ROOT, "index.html"), "utf8");
  const asset = shell.match(/\/assets\/[^"]+\.js/)[0];
  const r = await get(asset);
  eq(r.status, 200, "status");
  eq(r.headers.get("cache-control"), "public, max-age=31536000, immutable", "cache");
});
await check("images get a day", async () => {
  eq((await get("/favicon.svg")).headers.get("cache-control"), "public, max-age=86400", "cache");
});
await check("GET /api/health reports telegram configured", async () => {
  const b = await (await get("/api/health")).json();
  eq(b.telegram.configured, true, "configured");
  eq(b.telegram.token, "set", "token");
  eq(b.telegram.chatId, "set", "chatId");
});
await check("health never echoes the token", async () => {
  const raw = await (await get("/api/health?probe=telegram")).text();
  if (raw.includes(env.TELEGRAM_BOT_TOKEN) || raw.includes("AAAA")) throw new Error("token leaked");
});
await check("health names a missing variable", async () => {
  const b = await (await worker.fetch(new Request("https://x.test/api/health"), { ASSETS, TELEGRAM_CHAT_ID: "-100123" }, ctx)).json();
  eq(b.telegram.token, "missing", "token");
  eq(b.telegram.chatId, "set", "chatId");
  eq(b.telegram.configured, false, "configured");
});
await check("health names a malformed variable", async () => {
  const b = await (await worker.fetch(new Request("https://x.test/api/health"), { ASSETS, TELEGRAM_BOT_TOKEN: "hunter2", TELEGRAM_CHAT_ID: "not-an-id" }, ctx)).json();
  eq(b.telegram.token, "malformed", "token");
  eq(b.telegram.chatId, "malformed", "chatId");
});
await check("health flags a basic-group chat id", async () => {
  const b = await (await worker.fetch(new Request("https://x.test/api/health"), { ...env, TELEGRAM_CHAT_ID: "-5453380295" }, ctx)).json();
  if (!b.telegram.chatIdShape.startsWith("basic group")) throw new Error("shape: " + b.telegram.chatIdShape);
});
await check("health flags a supergroup chat id", async () => {
  const b = await (await worker.fetch(new Request("https://x.test/api/health"), { ...env, TELEGRAM_CHAT_ID: "-1005453380295" }, ctx)).json();
  eq(b.telegram.chatIdShape, "supergroup or channel", "shape");
});
await check("probe reports Telegram's own reason", async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = async (url) =>
    String(url).includes("getMe")
      ? new Response(JSON.stringify({ ok: true, result: { username: "elcorix_bot" } }), { status: 200 })
      : new Response(JSON.stringify({ ok: false, description: "Bad Request: chat not found" }), { status: 400 });
  const b = await (await get("/api/health?probe=telegram")).json();
  globalThis.fetch = saved;
  eq(b.telegram.probe.ok, false, "probe ok");
  eq(b.telegram.probe.step, "getChat", "step");
  eq(b.telegram.probe.error, "Bad Request: chat not found", "error");
  eq(b.telegram.probe.bot, "elcorix_bot", "bot");
});
await check("probe reports a good setup", async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = async (url) =>
    String(url).includes("getMe")
      ? new Response(JSON.stringify({ ok: true, result: { username: "elcorix_bot" } }), { status: 200 })
      : new Response(JSON.stringify({ ok: true, result: { type: "supergroup", title: "elcorix studio" } }), { status: 200 });
  const b = await (await get("/api/health?probe=telegram")).json();
  globalThis.fetch = saved;
  eq(b.telegram.probe.ok, true, "probe ok");
  eq(b.telegram.probe.chatTitle, "elcorix studio", "title");
});
await check("probe on an unconfigured deployment says so without calling out", async () => {
  const saved = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; return new Response("{}", { status: 200 }); };
  const b = await (await worker.fetch(new Request("https://x.test/api/health?probe=telegram"), { ASSETS }, ctx)).json();
  globalThis.fetch = saved;
  eq(b.telegram.probe.ok, false, "probe ok");
  if (called) throw new Error("called Telegram with no credentials");
});
await check("GET /api/bookings/link uses the company id", async () => {
  const b = await (await worker.fetch(new Request("https://x.test/api/bookings/link"), { ...env, ALTEGIO_COMPANY_ID: "424242" }, ctx)).json();
  eq(b.url, "https://n424242.alteg.io", "url");
});
await check("a bad company id falls back, never redirects elsewhere", async () => {
  const b = await (await worker.fetch(new Request("https://x.test/api/bookings/link"), { ...env, ALTEGIO_COMPANY_ID: "evil.example.com" }, ctx)).json();
  eq(b.url, "https://n000000.alteg.io", "url");
});
await check("GET /api/contact is 405", async () => eq((await get("/api/contact")).status, 405, "status"));
await check("unknown /api/ route is 404 JSON", async () => eq((await get("/api/nope")).status, 404, "status"));

sent = [];
await check("contact form posts to Telegram", async () => {
  const r = await post("/api/contact", { name: "Anna", email: "a@b.de", message: "Hallo", lang: "de", website: "" });
  eq(r.status, 201, "status");
  eq(sent.length, 1, "messages sent");
  if (!sent[0].text.includes("Anna")) throw new Error("name missing");
  if (!sent[0].text.includes("Hallo")) throw new Error("message missing");
});
sent = [];
await check("contact honeypot returns 201 and sends nothing", async () => {
  const r = await post("/api/contact", { name: "Bot", email: "b@b.de", message: "spam", website: "http://spam" });
  eq(r.status, 201, "status");
  eq(sent.length, 0, "messages sent");
});
await check("contact rejects a bad e-mail", async () => eq((await post("/api/contact", { name: "A", email: "nope", message: "x" })).status, 400, "status"));
await check("contact rejects an empty message", async () => eq((await post("/api/contact", { name: "A", email: "a@b.de", message: "  " })).status, 400, "status"));
sent = [];
await check("HTML in visitor input is escaped", async () => {
  await post("/api/contact", { name: "<b>x</b>", email: "a@b.de", message: "<script>alert(1)</script>" });
  if (sent[0].text.includes("<script>")) throw new Error("unescaped");
  if (!sent[0].text.includes("&lt;script&gt;")) throw new Error("not escaped as entity");
});

sent = [];
const future = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
await check("consultation form posts to Telegram", async () => {
  const r = await post("/api/bookings", { customerName: "Ivan", customerPhone: "+49 155 625 14 872", preferredAt: `${future} 14:00`, marketingConsent: true });
  eq(r.status, 201, "status");
  eq(sent.length, 1, "messages sent");
  if (!sent[0].text.includes("Ivan")) throw new Error("name missing");
  if (!sent[0].text.includes("yes")) throw new Error("consent missing");
});
await check("consultation rejects a junk phone", async () => eq((await post("/api/bookings", { customerName: "A", customerPhone: "asdf" })).status, 400, "status"));
await check("consultation rejects a past date", async () => eq((await post("/api/bookings", { customerName: "A", customerPhone: "+491556251487", preferredAt: "2020-01-01" })).status, 400, "status"));
await check("consultation rejects a bare time", async () => eq((await post("/api/bookings", { customerName: "A", customerPhone: "+491556251487", preferredAt: "14:00" })).status, 400, "status"));
await check("consultation accepts no preferred slot", async () => eq((await post("/api/bookings", { customerName: "A", customerPhone: "+491556251487", preferredAt: "" })).status, 201, "status"));

await check("a Telegram failure surfaces as 502", async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = async () => new Response("chat not found", { status: 400 });
  const r = await post("/api/contact", { name: "A", email: "a@b.de", message: "x" });
  globalThis.fetch = saved;
  eq(r.status, 502, "status");
});
await check("missing Telegram config is 503, not a silent success", async () => {
  const r = await worker.fetch(new Request("https://x.test/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "A", email: "a@b.de", message: "x" }) }), { ASSETS }, ctx);
  eq(r.status, 503, "status");
});
await check("non-JSON body is 415", async () => {
  const r = await worker.fetch(new Request("https://x.test/api/contact", { method: "POST", headers: { "content-type": "text/plain" }, body: "x" }), env, ctx);
  eq(r.status, 415, "status");
});

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
