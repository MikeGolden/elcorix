import nodemailer, { type Transporter } from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  /** Set to the visitor's address so staff can hit "Reply". */
  replyTo?: string;
}

export interface Mailer {
  /** False when SMTP is not configured — sends become no-ops. */
  enabled: boolean;
  /** Address that receives staff notifications (MAIL_TO). */
  notifyAddress: string | null;
  send(message: MailMessage): Promise<void>;
}

export const disabledMailer: Mailer = {
  enabled: false,
  notifyAddress: null,
  async send() {
    // SMTP not configured — nothing to do. Messages are still stored in
    // Postgres, so no data is lost; staff just aren't notified by e-mail.
  },
};

/**
 * Build a mailer from SMTP_* / MAIL_* environment variables. All of
 * SMTP_HOST, MAIL_FROM and MAIL_TO are required to enable it; anything
 * less returns the disabled mailer (with a startup warning, so a broken
 * production config is visible in the logs instead of silently eating
 * notifications).
 */
export function createMailerFromEnv(env: NodeJS.ProcessEnv = process.env): Mailer {
  const host = env.SMTP_HOST;
  const from = env.MAIL_FROM;
  const to = env.MAIL_TO;

  if (!host || !from || !to) {
    const partial = [host && "SMTP_HOST", from && "MAIL_FROM", to && "MAIL_TO"].filter(Boolean);
    if (partial.length > 0) {
      console.warn(
        `Mailer disabled: ${partial.join(", ")} set but SMTP_HOST, MAIL_FROM and MAIL_TO are all required`,
      );
    }
    return disabledMailer;
  }

  const port = Number(env.SMTP_PORT ?? 587);
  const transporter: Transporter = nodemailer.createTransport({
    host,
    port,
    secure: env.SMTP_SECURE === "true" || port === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" } : undefined,
  });

  return {
    enabled: true,
    notifyAddress: to,
    async send(message) {
      await transporter.sendMail({ from, ...message });
    },
  };
}

/**
 * Fire-and-forget wrapper: notifications must never delay or fail the
 * HTTP response — the record is already safely in Postgres.
 */
export function sendInBackground(mailer: Mailer, message: MailMessage): void {
  if (!mailer.enabled) return;
  const failed = (err: unknown) =>
    console.error(`Failed to send notification e-mail "${message.subject}":`, err);
  // try/catch as well as .catch(): a mailer that throws synchronously would
  // otherwise unwind into the route handler, which has already answered the
  // request — and the resulting second res.* call is a crash, not a bounce.
  try {
    void Promise.resolve(mailer.send(message)).catch(failed);
  } catch (err) {
    failed(err);
  }
}
