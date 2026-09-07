import { Router } from "express";
import type { Queryable } from "../db/pool.js";
import { sendInBackground, type Mailer } from "../mailer.js";
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

/**
 * The booking calendar itself is handled by the embedded Altegio widget
 * on the client. This router provides:
 *  - GET  /api/bookings/link  → the canonical Altegio booking URL
 *  - POST /api/bookings       → log a booking request locally (e.g. from
 *    a fallback form) so staff can follow up in Altegio.
 */
export function bookingsRouter(db: Queryable, mailer: Mailer) {
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
    // Free-text "YYYY-MM-DD HH:MM" from the consultation form. Kept as a
    // preference, not a confirmed slot — staff book the real appointment
    // in Altegio — so it is stored as text and only length-checked.
    if (preferredAt !== undefined && typeof preferredAt !== "string") {
      res.status(400).json({ error: "preferredAt must be a string" });
      return;
    }
    if (typeof preferredAt === "string" && preferredAt.length > 40) {
      res.status(400).json({ error: "preferredAt is too long" });
      return;
    }
    if (marketingConsent !== undefined && typeof marketingConsent !== "boolean") {
      res.status(400).json({ error: "marketingConsent must be a boolean" });
      return;
    }
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
          typeof preferredAt === "string" && preferredAt.trim() !== ""
            ? preferredAt.trim()
            : null,
          marketingConsent === true,
        ],
      );
      res.status(201).json(result.rows[0]);

      if (mailer.enabled && mailer.notifyAddress) {
        sendInBackground(mailer, {
          to: mailer.notifyAddress,
          subject: `New booking request from ${customerName.trim()}`,
          text:
            `Name: ${customerName.trim()}\nPhone: ${customerPhone.trim()}\n` +
            `Service: ${typeof service === "string" && service.trim() !== "" ? service.trim() : "—"}\n` +
            `Preferred: ${typeof preferredAt === "string" && preferredAt.trim() !== "" ? preferredAt.trim() : "—"}\n` +
            `Marketing opt-in: ${marketingConsent === true ? "yes" : "no"}\n\n` +
            "Please follow up and enter the appointment in Altegio.",
        });
      }
    } catch (err) {
      console.error("Failed to store booking request:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
