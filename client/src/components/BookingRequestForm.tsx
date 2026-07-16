import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

type Status = "idle" | "sending" | "sent" | "error";

const serviceKeys = [
  "facial",
  "permanentMakeup",
  "laser",
  "nails",
  "lashesBrows",
  "body",
] as const;

const inputClass =
  "mt-2 w-full rounded-none border-0 border-b border-brand-200 bg-transparent px-0 py-2 font-light text-brand-900 transition-colors placeholder:text-brand-300 focus:border-brand-900 focus:outline-none";

/**
 * Cookie-free alternative to the Altegio embed: a callback request that
 * only talks to our own API. Especially relevant for visitors who decline
 * the third-party calendar. Staff receive the request (DB + e-mail
 * notification) and enter the appointment in Altegio themselves.
 */
export default function BookingRequestForm() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: data.get("customerName"),
          customerPhone: data.get("customerPhone"),
          service: data.get("service"),
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
    <div className="border border-brand-200 bg-brand-100 p-8 sm:p-10">
      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-brand-900">
        {t("bookingForm.title")}
      </h2>
      <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-brand-700">
        {t("bookingForm.intro")}
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-6 sm:grid-cols-2"
        aria-label={t("bookingForm.title")}
      >
        <div>
          <label
            htmlFor="booking-name"
            className="block text-xs font-medium uppercase tracking-[0.2em] text-brand-700"
          >
            {t("bookingForm.name")}
          </label>
          <input id="booking-name" name="customerName" required className={inputClass} />
        </div>
        <div>
          <label
            htmlFor="booking-phone"
            className="block text-xs font-medium uppercase tracking-[0.2em] text-brand-700"
          >
            {t("bookingForm.phone")}
          </label>
          <input
            id="booking-phone"
            name="customerPhone"
            type="tel"
            required
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="booking-service"
            className="block text-xs font-medium uppercase tracking-[0.2em] text-brand-700"
          >
            {t("bookingForm.service")}
          </label>
          <select id="booking-service" name="service" className={inputClass}>
            <option value="">{t("bookingForm.serviceAny")}</option>
            {serviceKeys.map((key) => (
              <option key={key} value={t(`services.${key}.title`)}>
                {t(`services.${key}.title`)}
              </option>
            ))}
          </select>
        </div>
        {/* Honeypot — invisible to humans, catnip for spam bots. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="booking-website">Website</label>
          <input
            id="booking-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <p className="text-xs font-light leading-relaxed text-brand-700 sm:col-span-2">
          {t("bookingForm.privacyNote")}
        </p>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={status === "sending"}
            className="bg-brand-500 px-10 py-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-brand-50 transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {status === "sending" ? t("bookingForm.sending") : t("bookingForm.send")}
          </button>
          {status === "sent" && (
            <p role="status" className="mt-4 text-sm text-green-400">
              {t("bookingForm.success")}
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="mt-4 text-sm text-red-400">
              {t("bookingForm.error")}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
