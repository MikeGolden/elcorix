import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConsent } from "../consent/ConsentContext";

/**
 * GDPR consent banner. Non-modal on purpose: visitors must be able to read
 * the privacy policy (and the rest of the site) before deciding. “Accept
 * all” and “Only necessary” are styled identically — rejecting must be as
 * easy as accepting.
 */
export default function CookieBanner() {
  const { t } = useTranslation();
  const { bannerOpen, decide } = useConsent();

  if (!bannerOpen) return null;

  const buttonClass =
    "border border-brand-500 px-6 py-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-brand-900 transition-colors hover:bg-brand-500 hover:text-brand-50";

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-200 bg-brand-100 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2
            id="cookie-banner-title"
            className="font-display text-base font-bold uppercase tracking-wide text-brand-900"
          >
            {t("consent.title")}
          </h2>
          <p className="mt-1 text-sm font-light leading-relaxed text-brand-700">
            {t("consent.description")}{" "}
            <Link
              to="/privacy"
              className="font-medium text-brand-600 underline underline-offset-4"
            >
              {t("consent.privacyLink")}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => decide(false)} className={buttonClass}>
            {t("consent.necessaryOnly")}
          </button>
          <button type="button" onClick={() => decide(true)} className={buttonClass}>
            {t("consent.acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
