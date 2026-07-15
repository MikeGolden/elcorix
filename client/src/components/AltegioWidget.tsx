import { useTranslation } from "react-i18next";
import { altegioBookingUrl, business } from "../config";
import { useConsent } from "../consent/ConsentContext";

/**
 * Embeds the Altegio online-booking page (calendar, services, staff)
 * for the configured company — but only after the visitor has consented:
 * the embed sets third-party cookies from alteg.io, so GDPR requires the
 * two-click pattern (placeholder first, iframe after opt-in). The
 * new-tab fallback link needs no consent — no third-party content loads
 * on our page.
 */
export default function AltegioWidget() {
  const { t } = useTranslation();
  const { consent, decide } = useConsent();

  if (consent?.booking !== true) {
    return (
      <div
        data-testid="altegio-consent-placeholder"
        className="border border-brand-200 bg-white p-10 text-center"
      >
        <h2 className="font-display text-2xl font-medium text-brand-900">
          {t("booking.consentTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-light leading-relaxed text-brand-700">
          {t("booking.consentText")}
        </p>
        <button
          type="button"
          onClick={() => decide(true)}
          className="mt-6 bg-brand-900 px-8 py-3 text-xs font-medium uppercase tracking-[0.22em] text-brand-50 transition-colors hover:bg-brand-600"
        >
          {t("booking.consentLoad")}
        </button>
        <p className="mt-5 text-sm font-light text-brand-700">
          <a
            className="font-medium text-brand-600 underline underline-offset-4"
            href={altegioBookingUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t("booking.fallbackLink", { businessName: business.name })}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-brand-200 bg-white">
      <iframe
        title={t("booking.widgetTitle")}
        data-testid="altegio-widget"
        src={altegioBookingUrl}
        className="h-[720px] w-full"
        loading="lazy"
        allow="payment"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <p className="border-t border-brand-200 p-3 text-center text-sm font-light text-brand-700">
        {t("booking.fallbackQuestion")}{" "}
        <a
          className="font-medium text-brand-600 underline underline-offset-4"
          href={altegioBookingUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t("booking.fallbackLink", { businessName: business.name })}
        </a>
      </p>
    </div>
  );
}
