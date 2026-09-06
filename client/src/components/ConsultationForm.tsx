import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";

type Status = "idle" | "sending" | "sent" | "error";

/** Opening hours (09:00–19:00); the last slot starts half an hour before close. */
const FIRST_SLOT_MINUTES = 9 * 60;
const LAST_SLOT_MINUTES = 18 * 60 + 30;
const SLOT_MINUTES = 30;

/** "09:00", "09:30", … "18:30" — appointments start on the half hour only. */
const TIME_SLOTS = Array.from(
  { length: (LAST_SLOT_MINUTES - FIRST_SLOT_MINUTES) / SLOT_MINUTES + 1 },
  (_, i) => {
    const minutes = FIRST_SLOT_MINUTES + i * SLOT_MINUTES;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  },
);

/** Today in the local time zone as `YYYY-MM-DD`, so past dates stay unpickable. */
function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/**
 * The consultation request from the Figma ("Beratung erhalten"): name,
 * phone, preferred date and time, an optional marketing opt-in and a
 * required privacy consent.
 *
 * It talks only to our own API — no third-party script, no cookies — so
 * visitors who decline the Altegio calendar can still get an appointment.
 * Staff receive the request (database + e-mail notification) and enter the
 * appointment in Altegio themselves.
 */
export default function ConsultationForm() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const date = String(data.get("date") ?? "");
    const time = String(data.get("time") ?? "");
    setStatus("sending");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: data.get("customerName"),
          customerPhone: data.get("customerPhone"),
          preferredAt: [date, time].filter(Boolean).join(" "),
          marketingConsent: data.get("marketingConsent") === "on",
          // Honeypot: hidden from humans, bots fill it in.
          website: data.get("website"),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={t("consultation.title")}
      className="mx-auto max-w-3xl"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="consult-name" className="sr-only">
            {t("consultation.name")}
          </label>
          <input
            id="consult-name"
            name="customerName"
            required
            maxLength={200}
            autoComplete="name"
            placeholder={t("consultation.name")}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="consult-phone" className="sr-only">
            {t("consultation.phone")}
          </label>
          <input
            id="consult-phone"
            name="customerPhone"
            type="tel"
            required
            maxLength={50}
            autoComplete="tel"
            placeholder={t("consultation.phone")}
            className="field"
          />
        </div>
        <div className="min-w-0">
          <label
            htmlFor="consult-date"
            className="mb-2 block text-xs font-semibold text-ink-300"
          >
            {t("consultation.date")}
          </label>
          <input
            id="consult-date"
            name="date"
            type="date"
            min={today()}
            className="field"
          />
        </div>
        <div className="min-w-0">
          <label
            htmlFor="consult-time"
            className="mb-2 block text-xs font-semibold text-ink-300"
          >
            {t("consultation.time")}
          </label>
          <select
            id="consult-time"
            name="time"
            defaultValue=""
            className="field field-select"
          >
            <option value="">{t("consultation.timeAny")}</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Honeypot — invisible to humans, catnip for spam bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="consult-website">Website</label>
        <input id="consult-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-7 grid gap-5 text-xs leading-relaxed text-ink-500 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <input
            id="consult-marketing"
            name="marketingConsent"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
          />
          <label htmlFor="consult-marketing">{t("consultation.consentMarketing")}</label>
        </div>
        <div className="flex items-start gap-3">
          <input
            id="consult-privacy"
            name="privacyConsent"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
          />
          <label htmlFor="consult-privacy">
            <Trans
              i18nKey="consultation.consentPrivacy"
              components={{
                privacyLink: (
                  <Link to="/privacy" className="font-medium text-brand-600 underline underline-offset-2" />
                ),
              }}
            />
          </label>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button type="submit" disabled={status === "sending"} className="btn-primary px-10">
          {status === "sending" ? t("consultation.sending") : t("cta.consultation")}
        </button>
        {status === "sent" && (
          <p role="status" className="mt-4 text-sm font-medium text-brand-600">
            {t("consultation.success")}
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-600">
            {t("consultation.error")}
          </p>
        )}
      </div>
    </form>
  );
}
