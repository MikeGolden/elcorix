import { Router } from "express";
import type { Queryable } from "../db/pool.js";
import { sendInBackground, type Mailer } from "../mailer.js";
import { isSpam } from "./contact.js";

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
    const { service, customerName, customerPhone } = req.body ?? {};
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
    if (typeof service === "string" && service.length > 200) {
      res.status(400).json({ error: "service is too long" });
      return;
    }
    try {
      const result = await db.query(
        `INSERT INTO booking_requests
           (altegio_company_id, service, customer_name, customer_phone)
         VALUES ($1, $2, $3, $4) RETURNING id, status`,
        [
          altegioCompanyId(),
          typeof service === "string" ? service : null,
          customerName.trim(),
          customerPhone.trim(),
        ],
      );
      res.status(201).json(result.rows[0]);

      if (mailer.enabled && mailer.notifyAddress) {
        sendInBackground(mailer, {
          to: mailer.notifyAddress,
          subject: `New booking request from ${customerName.trim()}`,
          text:
            `Name: ${customerName.trim()}\nPhone: ${customerPhone.trim()}\n` +
            `Service: ${typeof service === "string" && service.trim() !== "" ? service.trim() : "—"}\n\n` +
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
