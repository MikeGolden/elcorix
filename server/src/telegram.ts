/**
 * Telegram notifications for consultation requests.
 *
 * A Telegram bot created with @BotFather posts every request from the
 * consultation form into the studio's chat, so staff see it on their phone
 * without waiting for e-mail. This is a one-way channel: the server calls
 * the Bot API, nothing calls us back — no webhook, no polling, no commands,
 * and therefore no public endpoint to secure.
 *
 * Like the mailer, it is optional: unset env vars mean the request is still
 * stored in Postgres and e-mailed, only the chat message is skipped.
 */

const API_BASE = "https://api.telegram.org";

/** Telegram rejects sendMessage above 4096 characters. */
const MAX_TEXT = 4096;

/** A slow Bot API must not keep a background task alive indefinitely. */
const TIMEOUT_MS = 10_000;

/** Numeric user/group id ("-1001234567890") or a public "@channelname". */
const CHAT_ID_RE = /^(-?\d{1,32}|@[A-Za-z][A-Za-z0-9_]{4,31})$/;

/** BotFather tokens look like "123456789:AA...". */
const BOT_TOKEN_RE = /^\d{5,20}:[A-Za-z0-9_-]{20,}$/;

export interface TelegramNotifier {
  /** False when the bot is not configured — sends become no-ops. */
  enabled: boolean;
  /** The chat requests are posted to, or null when disabled. */
  chatId: string | null;
  /** `text` may contain the small HTML subset Telegram supports. */
  send(text: string): Promise<void>;
}

export const disabledTelegram: TelegramNotifier = {
  enabled: false,
  chatId: null,
  async send() {
    // Bot not configured — nothing to do. Requests are still stored in
    // Postgres and (if SMTP is set up) e-mailed, so no data is lost.
  },
};

/**
 * Escape the five characters Telegram's HTML parse mode reacts to. Visitor
 * input is attacker-controlled: a name containing "<b>" must arrive as
 * those characters, not as markup that breaks the rest of the message.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface BookingNotification {
  customerName: string;
  customerPhone: string;
  service?: string | null;
  preferredAt?: string | null;
  marketingConsent?: boolean;
  /** Row id in booking_requests, so staff can quote it. */
  id?: number | string;
}

/**
 * The chat message for one consultation request. Every visitor-supplied
 * value goes through escapeHtml; the labels are ours and don't.
 */
export function formatBookingRequest(booking: BookingNotification): string {
  const dash = "—";
  const value = (raw: string | null | undefined) => {
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    return trimmed === "" ? dash : escapeHtml(trimmed);
  };
  const lines = [
    "<b>New consultation request</b>",
    "",
    `Name: ${value(booking.customerName)}`,
    `Phone: ${value(booking.customerPhone)}`,
    `Service: ${value(booking.service)}`,
    `Preferred: ${value(booking.preferredAt)}`,
    `Marketing opt-in: ${booking.marketingConsent === true ? "yes" : "no"}`,
  ];
  if (booking.id !== undefined && booking.id !== null) {
    lines.push(`Request #${escapeHtml(String(booking.id))}`);
  }
  lines.push("", "Please call back and enter the appointment in Altegio.");
  return lines.join("\n");
}

/**
 * Build a notifier from TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID. Both are
 * required; a half-finished or malformed configuration is disabled with a
 * warning so a broken production setup is visible in the logs instead of
 * silently swallowing every notification.
 *
 * `fetchImpl` exists for tests — production uses the global fetch (Node 22).
 */
export function createTelegramFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = globalThis.fetch,
): TelegramNotifier {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    if (token || chatId) {
      console.warn(
        "Telegram notifications disabled: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are both required",
      );
    }
    return disabledTelegram;
  }
  // Never log the token itself, here or anywhere else in this file — logs
  // get pasted into issues, and a leaked bot token lets anyone post as the
  // studio and read the chat's history through getUpdates.
  if (!BOT_TOKEN_RE.test(token)) {
    console.warn(
      "Telegram notifications disabled: TELEGRAM_BOT_TOKEN is not a BotFather token (expected \"<digits>:<secret>\")",
    );
    return disabledTelegram;
  }
  if (!CHAT_ID_RE.test(chatId)) {
    console.warn(
      `Telegram notifications disabled: TELEGRAM_CHAT_ID "${chatId}" is neither a numeric id nor an @channelname`,
    );
    return disabledTelegram;
  }

  const url = `${API_BASE}/bot${token}/sendMessage`;

  return {
    enabled: true,
    chatId,
    async send(text) {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, MAX_TEXT),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) {
        // The body carries Telegram's own reason ("chat not found",
        // "bot was blocked by the user"), which is what makes a
        // misconfiguration diagnosable. The URL must stay out of it.
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Telegram sendMessage failed: HTTP ${response.status}${detail ? ` — ${detail.slice(0, 300)}` : ""}`,
        );
      }
    },
  };
}

/**
 * Fire-and-forget: a chat notification must never delay or fail the HTTP
 * response — the request is already safely in Postgres. Mirrors
 * sendInBackground in mailer.ts, including the synchronous-throw guard: the
 * route has already answered, so an exception unwinding into it would be a
 * crash, not a bounce.
 */
export function notifyInBackground(telegram: TelegramNotifier, text: string): void {
  if (!telegram.enabled) return;
  const failed = (err: unknown) =>
    console.error("Failed to send Telegram notification:", err);
  try {
    void Promise.resolve(telegram.send(text)).catch(failed);
  } catch (err) {
    failed(err);
  }
}
