import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import ContactSection from "../sections/ContactSection";
import { usePageMeta } from "../seo/usePageMeta";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const { t, i18n } = useTranslation();
  usePageMeta("contact");
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
          // Language of the auto-reply confirmation e-mail.
          lang: i18n.resolvedLanguage,
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
    <>
      <div className="mx-auto max-w-[1200px] px-4 pt-14 sm:px-6 sm:pt-20">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t("contact.pageTitle")}</h1>
      </div>

      <ContactSection />

      <section aria-labelledby="contact-form-title" className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-[1200px] rounded-panel bg-surface-soft px-6 py-12 sm:px-10">
          <h2 id="contact-form-title" className="text-center text-2xl font-bold">
            {t("contact.formTitle")}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 max-w-3xl"
            aria-label={t("contact.formLabel")}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="sr-only">
                  {t("contact.name")}
                </label>
                <input
                  id="contact-name"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder={t("contact.name")}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="sr-only">
                  {t("contact.email")}
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t("contact.email")}
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-message" className="sr-only">
                  {t("contact.message")}
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  placeholder={t("contact.messagePlaceholder")}
                  className="field"
                />
              </div>
            </div>

            {/* Honeypot — invisible to humans, catnip for spam bots. */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="mt-6 flex items-start gap-3 text-xs leading-relaxed">
              <input
                id="contact-privacy"
                name="privacyConsent"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
              />
              <label htmlFor="contact-privacy">
                <Trans
                  i18nKey="contact.privacyConsent"
                  components={{
                    privacyLink: (
                      <Link
                        to="/privacy"
                        className="font-medium text-brand-600 underline underline-offset-2"
                      />
                    ),
                  }}
                />
              </label>
            </div>

            <div className="mt-8 text-center">
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-primary px-10"
              >
                {status === "sending" ? t("contact.sending") : t("contact.send")}
              </button>
              {status === "sent" && (
                <p role="status" className="mt-4 text-sm font-medium text-brand-600">
                  {t("contact.success")}
                </p>
              )}
              {status === "error" && (
                <p role="alert" className="mt-4 text-sm font-medium text-red-600">
                  {t("contact.error")}
                </p>
              )}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
