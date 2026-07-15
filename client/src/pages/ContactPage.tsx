import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { business } from "../config";

type Status = "idle" | "sending" | "sent" | "error";

const inputClass =
  "mt-2 w-full rounded-none border-0 border-b border-brand-200 bg-transparent px-0 py-2 font-light text-brand-900 transition-colors placeholder:text-brand-300 focus:border-brand-900 focus:outline-none";

export default function ContactPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
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
    <section aria-labelledby="contact" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div aria-hidden="true" className="h-px w-12 bg-brand-500" />
      <h1
        id="contact"
        className="mt-6 font-display text-4xl font-medium text-brand-900 sm:text-5xl"
      >
        {t("contact.title")}
      </h1>
      <div className="mt-12 grid gap-14 md:grid-cols-2">
        <div className="space-y-6">
          <p className="font-light leading-loose text-brand-700">{business.address}</p>
          <ul className="space-y-4 border-l border-brand-200 pl-6">
            <li>
              <a
                className="text-sm font-medium uppercase tracking-[0.15em] text-brand-600 transition-colors hover:text-brand-900"
                href={`tel:${business.phone.replace(/\s/g, "")}`}
              >
                {business.phone}
              </a>
            </li>
            <li>
              <a
                className="text-sm font-medium uppercase tracking-[0.15em] text-brand-600 transition-colors hover:text-brand-900"
                href={`mailto:${business.email}`}
              >
                {business.email}
              </a>
            </li>
            <li>
              <a
                className="text-sm font-medium uppercase tracking-[0.15em] text-brand-600 transition-colors hover:text-brand-900"
                href={business.instagram}
                target="_blank"
                rel="noreferrer"
              >
                {business.instagramHandle}
              </a>
            </li>
          </ul>
          <p className="text-sm font-light leading-relaxed text-brand-700">
            {t("contact.openingHours")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" aria-label={t("contact.formLabel")}>
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium uppercase tracking-[0.2em] text-brand-700"
            >
              {t("contact.name")}
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-[0.2em] text-brand-700"
            >
              {t("contact.email")}
            </label>
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-xs font-medium uppercase tracking-[0.2em] text-brand-700"
            >
              {t("contact.message")}
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder={t("contact.messagePlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="flex items-start gap-3">
            <input
              id="privacy-consent"
              name="privacyConsent"
              type="checkbox"
              required
              className="mt-1 accent-brand-600"
            />
            <label htmlFor="privacy-consent" className="text-sm font-light text-brand-700">
              <Trans
                i18nKey="contact.privacyConsent"
                components={{
                  privacyLink: (
                    <Link
                      to="/privacy"
                      className="font-medium text-brand-600 underline underline-offset-4"
                    />
                  ),
                }}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={status === "sending"}
            className="bg-brand-900 px-10 py-4 text-xs font-medium uppercase tracking-[0.22em] text-brand-50 transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {status === "sending" ? t("contact.sending") : t("contact.send")}
          </button>
          {status === "sent" && (
            <p role="status" className="text-sm text-green-700">
              {t("contact.success")}
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="text-sm text-red-700">
              {t("contact.error")}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
