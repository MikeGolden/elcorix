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
        className="rounded-panel border border-line bg-surface-soft px-6 py-12 text-center sm:px-10"
      >
        <h3 className="text-xl font-bold">{t("booking.consentTitle")}</h3>
        <p className="mx-auto mt-3 max-w-xl text-[0.95rem] leading-relaxed">
          {t("booking.consentText")}
        </p>
        <button type="button" onClick={() => decide(true)} className="btn-primary mt-7">
          {t("booking.consentLoad")}
        </button>
        <p className="mt-5 text-sm">
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
    <div>
      {/* The iframe is the only child of the clipping box, so all four of its
          corners follow the panel radius — with the fallback line inside it the
          bottom two stayed square. `rounded-panel` on the iframe itself as well:
          Safari does not always clip an iframe to a rounded ancestor. */}
      <div className="overflow-hidden rounded-panel bg-white">
        <iframe
          title={t("booking.widgetTitle")}
          data-testid="altegio-widget"
          src={altegioBookingUrl}
          className="block h-[720px] w-full rounded-panel"
          loading="lazy"
          allow="payment"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <p className="mt-4 text-center text-sm">
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
