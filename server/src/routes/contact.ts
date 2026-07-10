import { Router } from "express";
import type { Queryable } from "../db/pool.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return "Invalid body";
  const { name, email, message } = body as Record<string, unknown>;
  if (typeof name !== "string" || name.trim().length === 0)
    return "Name is required";
  if (name.length > 200) return "Name is too long";
  if (typeof email !== "string" || !EMAIL_RE.test(email))
    return "A valid e-mail is required";
  if (email.length > 320) return "E-mail is too long";
  if (typeof message !== "string" || message.trim().length === 0)
    return "Message is required";
  if (message.length > 5000) return "Message is too long";
  return null;
}

export function contactRouter(db: Queryable) {
  const router = Router();

  router.post("/", async (req, res) => {
    const error = validateContact(req.body);
    if (error) {
      res.status(400).json({ error });
      return;
    }
    const { name, email, message } = req.body;
    try {
      const result = await db.query(
        `INSERT INTO contact_messages (name, email, message)
         VALUES ($1, $2, $3) RETURNING id, created_at`,
        [name.trim(), email.trim(), message.trim()],
      );
      res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
      console.error("Failed to store contact message:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
