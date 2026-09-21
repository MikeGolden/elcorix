/**
 * Cloudflare Pages worker for the elcorix site (advanced mode).
 *
 * The Express API in ../../server cannot run on Pages: it needs Postgres and
 * SMTP, neither of which exist in the Workers runtime. This file replaces the
 * two endpoints the static site actually calls and delivers both of them to
 * the studio's Telegram chat instead:
 *
 *   POST /api/contact       — contact form   (name, email, message)
 *   POST /api/bookings      — consultation   (name, phone, preferred slot)
 *   GET  /api/bookings/link — canonical Altegio booking URL
 *   GET  /api/health        — configuration probe; ?probe=telegram also asks
 *                             Telegram whether the bot and chat are reachable
 *
 * Everything else is a static asset, served through env.ASSETS with the SPA
 * fallback the nginx config does (`try_files $uri $uri/index.html /index.html`).
 *
 * Advanced mode is used deliberately: a `functions/` directory is ignored by
 * dashboard drag-and-drop deployments, a root `_worker.js` is not — so this
 * file works whether the folder is dragged into the dashboard or pushed with
 * `wrangler pages deploy`. Because the worker owns every request, the routing
 * and header rules that would live in `_redirects` / `_headers` live here.
 *
 * NOTHING IS STORED. Telegram is the only delivery channel, so a failed send
 * is answered with a 5xx and the visitor sees the form's error state, rather
 * than a "thank you" for a message no one will ever read.
 *
 * Required environment variables (Pages → Settings → Variables and Secrets):
 *   TELEGRAM_BOT_TOKEN  secret — from @BotFather
 *   TELEGRAM_CHAT_ID    secret — studio chat id (group ids are negative)
 *   ALTEGIO_COMPANY_ID  plain  — digits only, optional (defaults to 000000)
 */

const TELEGRAM_API = "https://api.telegram.org";
const TELEGRAM_TIMEOUT_MS = 8000;
const TELEGRAM_MAX_TEXT = 4096;

/** BotFather tokens look like "123456789:AA...". */
const BOT_TOKEN_RE = /^\d{5,20}:[A-Za-z0-9_-]{20,}$/;
/** Numeric user/group id, or a public "@channelname". */
const CHAT_ID_RE = /^(-?\d{1,32}|@[A-Za-z][A-Za-z0-9_]{4,31})$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** "YYYY-MM-DD", optionally followed by " HH:MM". */
const PREFERRED_AT_RE = /^(\d{4})-(\d{2})-(\d{2})(?: ([01]\d|2[0-3]):([0-5]\d))?$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const SUPPORTED_LANGS = ["en", "de", "uk", "ru"];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return guardPost(request, () => handleContact(request, env));
    }
    if (url.pathname === "/api/bookings") {
      return guardPost(request, () => handleBooking(request, env));
    }
    if (url.pathname === "/api/bookings/link") {
      const companyId = altegioCompanyId(env);
      return json({ companyId, url: `https://n${companyId}.alteg.io` });
    }
    if (url.pathname === "/api/health") {
      return handleHealth(url, env);
    }
    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, 404);
    }

    return serveAsset(request, env, ctx);
  },
};

/* ------------------------------------------------------------------ *
 * Static assets
 * ------------------------------------------------------------------ */

/**
 * Serve the built site. Pages resolves `/de/preise/` to the prerendered
 * `de/preise/index.html` on its own; what is added here is the answer for
 * a URL that has no shell — `dist/404.html`, with a real 404 status.
 *
 * It used to be `/index.html` with a 200, which made every typo and every
 * scanner's guess an indexable copy of the home page. 404.html is the same
 * app document, so a visitor still lands on the site's own 404 page, but
 * the status and the `noindex` in its head tell a crawler the truth.
 *
 * NOT mirrored here: the legacy-URL 301s that docker/nginx.conf builds
 * from `_redirects.map` (client/src/seo/redirects.ts). On this deployment
 * an old URL reaches 404.html and the router redirects it in the browser —
 * right for a visitor, a dead end for a crawler. Worth closing if Pages
 * ever becomes the live deployment again; see the map file for the list.
 */
async function serveAsset(request, env, ctx) {
  // Build output, not content — and the one asset whose 404 must not be
  // dressed up as a page.
  if (new URL(request.url).pathname === "/_redirects.map") {
    return withSiteHeaders(new Response("Not found", { status: 404 }), "/_redirects.map");
  }

  let response = await env.ASSETS.fetch(request);

  if (response.status === 404 && request.method === "GET") {
    const url = new URL(request.url);
    url.pathname = "/404.html";
    url.search = "";
    const fallback = await env.ASSETS.fetch(new Request(url.toString(), request));
    if (fallback.ok) {
      response = new Response(fallback.body, {
        status: 404,
        headers: fallback.headers,
      });
    }
  }

  return withSiteHeaders(response, new URL(request.url).pathname);
}

/**
 * Security and caching headers. `assets/` filenames carry a content hash, so
 * they are immutable; images are versioned by hand and get a day. HTML is
 * always revalidated so a redeploy is visible immediately.
 */
function withSiteHeaders(response, pathname) {
  const headers = new Headers(response.headers);

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), interest-cohort=()",
  );

  if (pathname.startsWith("/assets/")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (/\.(png|jpe?g|webp|avif|svg|ico|woff2?)$/i.test(pathname)) {
    headers.set("Cache-Control", "public, max-age=86400");
  } else {
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/* ------------------------------------------------------------------ *
 * API
 * ------------------------------------------------------------------ */

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Both form endpoints are POST-only and JSON-only. */
async function guardPost(request, handler) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { Allow: "POST" } });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().includes("application/json")) {
    return json({ error: "Expected application/json" }, 415);
  }
  try {
    return await handler();
  } catch (err) {
    // HttpError carries a status the visitor's form can act on (a failed
    // Telegram delivery is a 502, not a validation problem); anything else
    // is a bug here and stays a generic 500.
    if (err instanceof HttpError) {
      console.error(`Request failed (${err.status}):`, err.message);
      return json({ error: err.message }, err.status);
    }
    console.error("Request failed:", err instanceof Error ? err.message : err);
    return json({ error: "Internal server error" }, 500);
  }
}

async function readJson(request) {
  // A body larger than any legitimate form submission is refused before it
  // is parsed — the fields are capped at ~5 KB between them.
  const raw = await request.text();
  if (raw.length > 32_768) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/** True when the hidden honeypot field was filled in — i.e. a spam bot. */
function isSpam(body) {
  return typeof body.website === "string" && body.website.trim().length > 0;
}

/**
 * Phone check copied from server/src/phone.ts (and client/src/phone.ts):
 * loose about formatting, strict about content.
 */
function isValidPhone(value) {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.length > 50) return false;
  if (!/^\+?[\d\s()./-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** Mirrors validatePreferredAt in server/src/routes/bookings.ts. */
function validatePreferredAt(value) {
  const match = PREFERRED_AT_RE.exec(value);
  if (match === null) {
    return "preferredAt must be YYYY-MM-DD, optionally followed by HH:MM";
  }
  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day)
  ) {
    return "preferredAt is not a real date";
  }
  if (date.getTime() < Date.now() - DAY_MS) {
    return "preferredAt is in the past";
  }
  return null;
}

/**
 * The company id is interpolated into the booking URL, so accept digits only —
 * a malformed env value must never become a redirect to another host.
 */
function altegioCompanyId(env) {
  const raw = (env.ALTEGIO_COMPANY_ID ?? "").trim();
  return /^\d{1,12}$/.test(raw) ? raw : "000000";
}

async function handleContact(request, env) {
  const body = await readJson(request);
  if (body === null) return json({ error: "Invalid body" }, 400);

  // Answer a bot exactly like a success so it does not learn it was filtered.
  if (isSpam(body)) return json({ id: 0 }, 201);

  const { name, email, message } = body;
  if (typeof name !== "string" || name.trim() === "")
    return json({ error: "Name is required" }, 400);
  if (name.length > 200) return json({ error: "Name is too long" }, 400);
  if (typeof email !== "string" || !EMAIL_RE.test(email))
    return json({ error: "A valid e-mail is required" }, 400);
  if (email.length > 320) return json({ error: "E-mail is too long" }, 400);
  if (typeof message !== "string" || message.trim() === "")
    return json({ error: "Message is required" }, 400);
  if (message.length > 5000) return json({ error: "Message is too long" }, 400);

  const lang = SUPPORTED_LANGS.includes(body.lang) ? body.lang : "de";
  const text = [
    "<b>New contact message</b>",
    "",
    `Name: ${escapeHtml(name.trim())}`,
    `E-mail: ${escapeHtml(email.trim())}`,
    `Language: ${escapeHtml(lang)}`,
    "",
    escapeHtml(message.trim()),
  ].join("\n");

  await notify(env, text);
  return json({ id: 0, delivered: "telegram" }, 201);
}

async function handleBooking(request, env) {
  const body = await readJson(request);
  if (body === null) return json({ error: "Invalid body" }, 400);

  if (isSpam(body)) return json({ id: 0, status: "pending" }, 201);

  const { service, customerName, customerPhone, preferredAt, marketingConsent } =
    body;

  if (typeof customerName !== "string" || customerName.trim() === "")
    return json({ error: "customerName is required" }, 400);
  if (customerName.length > 200)
    return json({ error: "customerName is too long" }, 400);
  if (typeof customerPhone !== "string" || customerPhone.trim() === "")
    return json({ error: "customerPhone is required" }, 400);
  if (customerPhone.length > 50)
    return json({ error: "customerPhone is too long" }, 400);
  if (!isValidPhone(customerPhone))
    return json({ error: "customerPhone is invalid" }, 400);
  if (typeof service === "string" && service.length > 200)
    return json({ error: "service is too long" }, 400);
  if (preferredAt !== undefined && preferredAt !== null && typeof preferredAt !== "string")
    return json({ error: "preferredAt must be a string" }, 400);

  const slot = typeof preferredAt === "string" ? preferredAt.trim() : "";
  if (slot !== "") {
    if (slot.length > 40) return json({ error: "preferredAt is too long" }, 400);
    const error = validatePreferredAt(slot);
    if (error !== null) return json({ error }, 400);
  }
  if (marketingConsent !== undefined && typeof marketingConsent !== "boolean")
    return json({ error: "marketingConsent must be a boolean" }, 400);

  await notify(
    env,
    formatBookingRequest({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      service: typeof service === "string" ? service : null,
      preferredAt: slot,
      marketingConsent: marketingConsent === true,
    }),
  );

  return json({ id: 0, status: "pending", delivered: "telegram" }, 201);
}

/* ------------------------------------------------------------------ *
 * Health / configuration probe
 * ------------------------------------------------------------------ */

/**
 * Why this exists: on Pages the two secrets are set in a dashboard, in one of
 * two environments, and — the trap — they only reach a deployment created
 * AFTER they were saved. A form that silently does nothing is therefore
 * ambiguous between "not set", "set on the wrong environment", "set but the
 * deployment is older", and "set correctly but Telegram rejects the chat".
 * This endpoint separates those four without ever revealing the token.
 *
 *   GET /api/health                 — what this deployment can see
 *   GET /api/health?probe=telegram  — plus a live getMe/getChat round-trip
 *
 * Neither form echoes the token: only whether it is absent, the wrong shape,
 * or present, and the bot username Telegram itself reports back.
 */
async function handleHealth(url, env) {
  const token = (env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = (env.TELEGRAM_CHAT_ID ?? "").trim();

  const state = (value, ok) => (value === "" ? "missing" : ok ? "set" : "malformed");
  const telegram = {
    configured: telegramFromEnv(env) !== null,
    token: state(token, BOT_TOKEN_RE.test(token)),
    chatId: state(chatId, CHAT_ID_RE.test(chatId)),
    chatIdShape: describeChatId(chatId),
  };

  const body = {
    status: "ok",
    altegioCompanyId: altegioCompanyId(env),
    telegram,
  };

  if (url.searchParams.get("probe") === "telegram") {
    body.telegram.probe = await probeTelegram(token, chatId, telegram.configured);
  }

  return json(body);
}

/**
 * Which kind of chat an id claims to be. Worth reporting because a basic
 * group that gets upgraded to a supergroup CHANGES ID — from "-4…" to
 * "-100…" — and every send to the old id fails with "chat not found" while
 * the site itself looks perfectly healthy.
 */
function describeChatId(chatId) {
  if (chatId === "") return "missing";
  if (chatId.startsWith("@")) return "public channel username";
  if (chatId.startsWith("-100")) return "supergroup or channel";
  if (chatId.startsWith("-")) return "basic group (ids change to -100… on upgrade)";
  if (/^\d+$/.test(chatId)) return "private chat with one user";
  return "unrecognised";
}

/**
 * Ask Telegram directly. getMe validates the token, getChat validates that
 * this bot can see that chat — the two failures people actually hit. The
 * token stays out of the result; Telegram's own `description` goes in,
 * because that string ("Unauthorized", "chat not found") is the answer.
 */
async function probeTelegram(token, chatId, configured) {
  if (!configured) {
    return { ok: false, error: "Not configured on this deployment" };
  }
  const call = async (method, payload) => {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    });
    const parsed = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, parsed };
  };

  try {
    const me = await call("getMe", {});
    if (!me.ok) {
      return {
        ok: false,
        step: "getMe",
        error: me.parsed.description ?? `HTTP ${me.status}`,
      };
    }
    const chat = await call("getChat", { chat_id: chatId });
    if (!chat.ok) {
      return {
        ok: false,
        step: "getChat",
        bot: me.parsed.result?.username ?? null,
        error: chat.parsed.description ?? `HTTP ${chat.status}`,
      };
    }
    return {
      ok: true,
      bot: me.parsed.result?.username ?? null,
      chatType: chat.parsed.result?.type ?? null,
      chatTitle: chat.parsed.result?.title ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Probe failed",
    };
  }
}

/* ------------------------------------------------------------------ *
 * Telegram
 * ------------------------------------------------------------------ */

/**
 * Escape the five characters Telegram's HTML parse mode reacts to. Visitor
 * input is attacker-controlled: a name containing "<b>" must arrive as those
 * characters, not as markup that breaks the rest of the message.
 */
function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Same layout as formatBookingRequest in server/src/telegram.ts. */
function formatBookingRequest(booking) {
  const dash = "—";
  const value = (raw) => {
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    return trimmed === "" ? dash : escapeHtml(trimmed);
  };
  return [
    "<b>New consultation request</b>",
    "",
    `Name: ${value(booking.customerName)}`,
    `Phone: ${value(booking.customerPhone)}`,
    `Service: ${value(booking.service)}`,
    `Preferred: ${value(booking.preferredAt)}`,
    `Marketing opt-in: ${booking.marketingConsent === true ? "yes" : "no"}`,
    "",
    "Please call back and enter the appointment in Altegio.",
  ].join("\n");
}

/**
 * Validate the bot configuration. Never log or echo the token itself: a
 * leaked token lets anyone post as the studio and read the chat history.
 */
function telegramFromEnv(env) {
  const token = (env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = (env.TELEGRAM_CHAT_ID ?? "").trim();
  if (!token || !chatId) return null;
  if (!BOT_TOKEN_RE.test(token) || !CHAT_ID_RE.test(chatId)) return null;
  return { token, chatId };
}

/**
 * Deliver one message. Unlike the Express server — which has already stored
 * the request in Postgres by this point and can afford to fire and forget —
 * this is the only copy, so the caller awaits it and a failure becomes a 502.
 */
async function notify(env, text) {
  const config = telegramFromEnv(env);
  if (config === null) {
    console.error(
      "Telegram is not configured: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID",
    );
    throw new HttpError(503, "Notifications are not configured");
  }

  const response = await fetch(`${TELEGRAM_API}/bot${config.token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.chatId,
      text: text.slice(0, TELEGRAM_MAX_TEXT),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
  });

  if (!response.ok) {
    // Telegram's own reason ("chat not found", "bot was blocked") is what
    // makes a misconfiguration diagnosable. The URL must stay out of it.
    const detail = await response.text().catch(() => "");
    console.error(
      `Telegram sendMessage failed: HTTP ${response.status}${detail ? ` — ${detail.slice(0, 300)}` : ""}`,
    );
    throw new HttpError(502, "Could not deliver the message");
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
