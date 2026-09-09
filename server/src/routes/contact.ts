import { Router } from "express";
import type { Queryable } from "../db/pool.js";
import { sendInBackground, type Mailer } from "../mailer.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUPPORTED_LANGS = ["en", "de", "uk", "ru"] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

/**
 * Signature on the auto-reply. Must match the name and city the site itself
 * uses (client/src/config.ts) — a confirmation signed by a different
 * business in a different town reads as a phishing attempt.
 */
const BUSINESS_SIGNATURE = "elcorix — Kempten";

/** Auto-reply copy per language (the client sends its active language). */
const confirmation: Record<Lang, { subject: string; text: string }> = {
  en: {
    subject: "We received your message — elcorix",
    text: `Thank you for your message! We will get back to you as soon as possible, usually within one business day.\n\n${BUSINESS_SIGNATURE}`,
  },
  de: {
    subject: "Wir haben Ihre Nachricht erhalten — elcorix",
    text: `Vielen Dank für Ihre Nachricht! Wir melden uns so schnell wie möglich bei Ihnen, in der Regel innerhalb eines Werktages.\n\n${BUSINESS_SIGNATURE}`,
  },
  uk: {
    subject: "Ми отримали ваше повідомлення — elcorix",
    text: `Дякуємо за ваше повідомлення! Ми відповімо вам якнайшвидше, зазвичай протягом одного робочого дня.\n\n${BUSINESS_SIGNATURE}`,
  },
  ru: {
    subject: "Мы получили ваше сообщение — elcorix",
    text: `Спасибо за ваше сообщение! Мы ответим вам как можно скорее, обычно в течение одного рабочего дня.\n\n${BUSINESS_SIGNATURE}`,
  },
};

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

/** True when the hidden honeypot field was filled in — i.e. a spam bot. */
export function isSpam(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const { website } = body as Record<string, unknown>;
  return typeof website === "string" && website.trim().length > 0;
}

function requestLang(raw: unknown): Lang {
  return SUPPORTED_LANGS.includes(raw as Lang) ? (raw as Lang) : "de";
}

export function contactRouter(db: Queryable, mailer: Mailer) {
  const router = Router();

  router.post("/", async (req, res) => {
    // Honeypot: real users never see the "website" field. Answer exactly
    // like a success so bots don't learn they were filtered, store nothing.
    if (isSpam(req.body)) {
      res.status(201).json({ id: 0 });
      return;
    }
    const error = validateContact(req.body);
    if (error) {
      res.status(400).json({ error });
      return;
    }
    const { name, email, message } = req.body;
    const lang = requestLang((req.body as Record<string, unknown>).lang);

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
      return;
    }

    // Notifications go out after the response, and outside the try above:
    // the record is already stored, so nothing here may turn into a second
    // res.* call on an answered request.
    if (mailer.enabled && mailer.notifyAddress) {
      sendInBackground(mailer, {
        to: mailer.notifyAddress,
        subject: `New contact message from ${name.trim()}`,
        text: `Name: ${name.trim()}\nE-mail: ${email.trim()}\n\n${message.trim()}`,
        replyTo: email.trim(),
      });
      sendInBackground(mailer, { to: email.trim(), ...confirmation[lang] });
    }
  });

  return router;
}
