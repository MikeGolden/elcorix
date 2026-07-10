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
        className="rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm"
      >
        <h2 className="text-lg font-semibold">{t("booking.consentTitle")}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-brand-700">
          {t("booking.consentText")}
        </p>
        <button
          type="button"
          onClick={() => decide(true)}
          className="mt-5 rounded-full bg-brand-600 px-6 py-2 font-medium text-white hover:bg-brand-700"
        >
          {t("booking.consentLoad")}
        </button>
        <p className="mt-4 text-sm text-brand-700">
          <a
            className="font-medium text-brand-600 underline"
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
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
      <iframe
        title={t("booking.widgetTitle")}
        data-testid="altegio-widget"
        src={altegioBookingUrl}
        className="h-[720px] w-full"
        loading="lazy"
        allow="payment"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <p className="border-t border-brand-100 p-3 text-center text-sm text-brand-700">
        {t("booking.fallbackQuestion")}{" "}
        <a
          className="font-medium text-brand-600 underline"
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
