import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import type { Queryable } from "./db/pool.js";
import { createMailerFromEnv, disabledMailer, type Mailer } from "./mailer.js";
import {
  createTelegramFromEnv,
  disabledTelegram,
  type TelegramNotifier,
} from "./telegram.js";
import { contactRouter } from "./routes/contact.js";
import { bookingsRouter } from "./routes/bookings.js";

export interface AppOptions {
  /**
   * Origins allowed to call the API cross-origin. Defaults to
   * CORS_ALLOWED_ORIGINS (comma-separated). Empty means CORS is disabled —
   * fine when the client is served from the same origin or via the Vite
   * dev proxy.
   */
  corsOrigins?: string[];
  /** Max write requests (POST) per IP per window. Default 30 / 15 min. */
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
  /** Notification mailer. Defaults to the SMTP/MAIL env configuration. */
  mailer?: Mailer;
  /**
   * Telegram notifier for consultation requests. Defaults to the
   * TELEGRAM_* env configuration.
   */
  telegram?: TelegramNotifier;
}

export function createApp(db: Queryable, options: AppOptions = {}) {
  const app = express();

  // Only trust proxy-provided client IPs when explicitly deployed behind a
  // reverse proxy, otherwise X-Forwarded-For could be spoofed to evade
  // rate limiting.
  const trustProxy = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  app.set("trust proxy", trustProxy > 0 ? trustProxy : false);
  app.disable("x-powered-by");

  app.use(helmet());

  // Request logging (skipped in tests and for the healthcheck's polling).
  if (process.env.NODE_ENV !== "test") {
    app.use(
      morgan("combined", {
        skip: (req) => req.url === "/api/health",
      }),
    );
  }

  const corsOrigins =
    options.corsOrigins ??
    (process.env.CORS_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  app.use(cors({ origin: corsOrigins.length > 0 ? corsOrigins : false }));

  // 32kb, not 16: the contact form allows a 5000-character message, and
  // 5000 characters of Cyrillic or emoji exceed 16kb once JSON-encoded —
  // the request would have been rejected by the body parser before the
  // "Message is too long" check could produce a useful error.
  app.use(express.json({ limit: "32kb" }));

  const writeLimiter = rateLimit({
    windowMs: options.rateLimitWindowMs ?? 15 * 60 * 1000,
    limit: options.rateLimitMax ?? 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
  });
  app.use(["/api/contact", "/api/bookings"], (req, res, next) => {
    if (req.method === "POST") writeLimiter(req, res, next);
    else next();
  });

  // Liveness + readiness: verify the database actually answers, so
  // orchestration (compose healthcheck, monitoring) sees DB outages.
  app.get("/api/health", async (_req, res) => {
    try {
      await db.query("SELECT 1");
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "degraded" });
    }
  });

  const mailer = options.mailer ?? (process.env.NODE_ENV === "test" ? disabledMailer : createMailerFromEnv());
  if (!mailer.enabled && process.env.NODE_ENV === "production") {
    console.warn(
      "SMTP is not configured (SMTP_HOST/MAIL_FROM/MAIL_TO) — contact and booking notifications will only be stored in the database",
    );
  }

  const telegram =
    options.telegram ??
    (process.env.NODE_ENV === "test" ? disabledTelegram : createTelegramFromEnv());

  app.use("/api/contact", contactRouter(db, mailer));
  app.use("/api/bookings", bookingsRouter(db, mailer, telegram));

  // Unmatched API routes: Express's default 404 is an HTML page, which a
  // fetch() calling res.json() cannot parse. Everything under /api must
  // answer JSON, errors included.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // JSON error responses instead of Express's HTML error page; never leak
  // stack traces or internals to the client.
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status: unknown }).status)
        : 500;
    if (status >= 400 && status < 500) {
      // 413 is worth naming: "Invalid request" sends the visitor looking
      // for a typo when the real problem is the size of what they wrote.
      res.status(status).json({
        error: status === 413 ? "Request body is too large" : "Invalid request",
      });
      return;
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
