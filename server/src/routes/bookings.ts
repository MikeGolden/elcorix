import { Router } from "express";
import type { Queryable } from "../db/pool.js";

const ALTEGIO_COMPANY_ID = process.env.ALTEGIO_COMPANY_ID ?? "000000";

/**
 * The booking calendar itself is handled by the embedded Altegio widget
 * on the client. This router provides:
 *  - GET  /api/bookings/link  → the canonical Altegio booking URL
 *  - POST /api/bookings       → log a booking request locally (e.g. from
 *    a fallback form) so staff can follow up in Altegio.
 */
export function bookingsRouter(db: Queryable) {
  const router = Router();

  router.get("/link", (_req, res) => {
    res.json({
      companyId: ALTEGIO_COMPANY_ID,
      url: `https://n${ALTEGIO_COMPANY_ID}.alteg.io`,
    });
  });

  router.post("/", async (req, res) => {
    const { service, customerName, customerPhone } = req.body ?? {};
    if (typeof customerName !== "string" || customerName.trim() === "") {
      res.status(400).json({ error: "customerName is required" });
      return;
    }
    if (typeof customerPhone !== "string" || customerPhone.trim() === "") {
      res.status(400).json({ error: "customerPhone is required" });
      return;
    }
    try {
      const result = await db.query(
        `INSERT INTO booking_requests
           (altegio_company_id, service, customer_name, customer_phone)
         VALUES ($1, $2, $3, $4) RETURNING id, status`,
        [
          ALTEGIO_COMPANY_ID,
          typeof service === "string" ? service : null,
          customerName.trim(),
          customerPhone.trim(),
        ],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Failed to store booking request:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
