import { Router } from "express";
import type { Queryable } from "../db/pool.js";
import { sendInBackground, type Mailer } from "../mailer.js";
import {
  disabledTelegram,
  BOOKING_NOTIFICATION,
  notifyInBackground,
  type TelegramNotifier,
} from "../telegram.js";
import { isSpam } from "./contact.js";
import { isValidPhone } from "../phone.js";

/**
 * The company id is interpolated into the booking URL, so accept digits
 * only — a malformed env value must never become a redirect to an
 * attacker-controlled host (this URL will front the payment flow).
 */
function altegioCompanyId(): string {
  const raw = process.env.ALTEGIO_COMPANY_ID ?? "";
  return /^\d{1,12}$/.test(raw) ? raw : "000000";
}

/** "YYYY-MM-DD", optionally followed by " HH:MM". */
const PREFERRED_AT_RE = /^(\d{4})-(\d{2})-(\d{2})(?: ([01]\d|2[0-3]):([0-5]\d))?$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The preferred slot is a customer wish, not a confirmed appointment — the
 * real booking is made in Altegio — but it still has to be a slot a human
 * can act on. A bare time with no day ("14:00") is meaningless to staff,
 * and a date in the past is always a mistake, so both are rejected here
 * rather than stored.
 *
 * The visitor's clock may legitimately be a day ahead of the server's, so
 * "yesterday" in UTC is still accepted; anything older is not.
 */
export function validatePreferredAt(value: string): string | null {
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
 * The booking calendar itself is handled by the embedded Altegio widget
 * on the client. This router provides:
 *  - GET  /api/bookings/link  → the canonical Altegio booking URL
 *  - POST /api/bookings       → log a booking request locally (e.g. from
 *    a fallback form) so staff can follow up in Altegio.
 *
 * Staff are notified twice over, by e-mail and in Telegram; each channel is
 * optional and enabled by its own environment variables.
 */
export function bookingsRouter(
  db: Queryable,
  mailer: Mailer,
  telegram: TelegramNotifier = disabledTelegram,
) {
  const router = Router();

  router.get("/link", (_req, res) => {
    const companyId = altegioCompanyId();
    res.json({
      companyId,
      url: `https://n${companyId}.alteg.io`,
    });
  });

  router.post("/", async (req, res) => {
    // Honeypot (same pattern as the contact form): pretend success, store
    // nothing, notify nobody.
    if (isSpam(req.body)) {
      res.status(201).json({ id: 0, status: "pending" });
      return;
    }
    const { service, customerName, customerPhone, preferredAt, marketingConsent } =
      req.body ?? {};
    if (typeof customerName !== "string" || customerName.trim() === "") {
      res.status(400).json({ error: "customerName is required" });
      return;
    }
    if (customerName.length > 200) {
      res.status(400).json({ error: "customerName is too long" });
      return;
    }
    if (typeof customerPhone !== "string" || customerPhone.trim() === "") {
      res.status(400).json({ error: "customerPhone is required" });
      return;
    }
    if (customerPhone.length > 50) {
      res.status(400).json({ error: "customerPhone is too long" });
      return;
    }
    // Same rule as the form (client/src/phone.ts) — the form check is a
    // courtesy, this one is the guarantee.
    if (!isValidPhone(customerPhone)) {
      res.status(400).json({ error: "customerPhone is invalid" });
      return;
    }
    if (typeof service === "string" && service.length > 200) {
      res.status(400).json({ error: "service is too long" });
      return;
    }
    if (preferredAt !== undefined && preferredAt !== null && typeof preferredAt !== "string") {
      res.status(400).json({ error: "preferredAt must be a string" });
      return;
    }
    const trimmedPreferredAt =
      typeof preferredAt === "string" ? preferredAt.trim() : "";
    if (trimmedPreferredAt !== "") {
      if (trimmedPreferredAt.length > 40) {
        res.status(400).json({ error: "preferredAt is too long" });
        return;
      }
      const preferredAtError = validatePreferredAt(trimmedPreferredAt);
      if (preferredAtError !== null) {
        res.status(400).json({ error: preferredAtError });
        return;
      }
    }
    if (marketingConsent !== undefined && typeof marketingConsent !== "boolean") {
      res.status(400).json({ error: "marketingConsent must be a boolean" });
      return;
    }

    let created: { id?: number } | undefined;
    try {
      const result = await db.query(
        `INSERT INTO booking_requests
           (altegio_company_id, service, customer_name, customer_phone,
            preferred_at, marketing_consent)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, status`,
        [
          altegioCompanyId(),
          typeof service === "string" ? service : null,
          customerName.trim(),
          customerPhone.trim(),
          trimmedPreferredAt !== "" ? trimmedPreferredAt : null,
          marketingConsent === true,
        ],
      );
      created = result.rows[0];
      res.status(201).json(created);
    } catch (err) {
      console.error("Failed to store booking request:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    // Outside the try above on purpose: the request is answered and the
    // record stored, so nothing here may produce a second response.
    if (mailer.enabled && mailer.notifyAddress) {
      sendInBackground(mailer, {
        to: mailer.notifyAddress,
        subject: `New booking request from ${customerName.trim()}`,
        text:
          `Name: ${customerName.trim()}\nPhone: ${customerPhone.trim()}\n` +
          `Service: ${typeof service === "string" && service.trim() !== "" ? service.trim() : "—"}\n` +
          `Preferred: ${trimmedPreferredAt !== "" ? trimmedPreferredAt : "—"}\n` +
          `Marketing opt-in: ${marketingConsent === true ? "yes" : "no"}\n\n` +
          "Please follow up and enter the appointment in Altegio.",
      });
    }

    notifyInBackground(telegram, BOOKING_NOTIFICATION);
  });

  return router;
}
