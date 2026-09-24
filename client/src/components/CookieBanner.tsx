import LocalizedLink from "./LocalizedLink";
import { useTranslation } from "react-i18next";
import { useConsent } from "../consent/ConsentContext";
import { features } from "../config";

/**
 * GDPR consent banner. Non-modal on purpose: visitors must be able to read
 * the privacy policy (and the rest of the site) before deciding. “Accept
 * all” and “Only necessary” are styled identically — rejecting must be as
 * easy as accepting.
 *
 * The only thing it asks about is the Altegio calendar — the map loads
 * without consent (a documented decision) and Umami sets no cookies. So
 * with the Altegio flag off there is nothing to consent to, and the banner
 * (with the footer's "Cookie settings") is not rendered at all: asking
 * permission for something that never loads is noise, not compliance.
 * Turning the flag on brings both back, with the privacy policy's
 * `cookie-consent` storage line (gated on the same flag in legal.json).
 */
export default function CookieBanner() {
  const { t } = useTranslation();
  const { bannerOpen, decide } = useConsent();

  if (!features.altegio || !bannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 rounded-panel border border-line bg-white p-5 shadow-[0_18px_48px_rgba(20,32,63,0.18)] sm:flex-row sm:items-center sm:p-6">
        <div className="flex-1">
          <h2 id="cookie-banner-title" className="text-base font-bold">
            {t("consent.title")}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed">
            {t("consent.description")}{" "}
            <LocalizedLink to="/datenschutz" className="font-medium text-brand-600 underline underline-offset-4">
              {t("consent.privacyLink")}
            </LocalizedLink>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <button type="button" onClick={() => decide(false)} className="btn-ghost">
            {t("consent.necessaryOnly")}
          </button>
          <button type="button" onClick={() => decide(true)} className="btn-primary">
            {t("consent.acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
