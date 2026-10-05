import LocalizedLink from "./LocalizedLink";
import { useTranslation } from "react-i18next";
import { business, features } from "../config";
import { useConsent } from "../consent/ConsentContext";
import Logo from "./Logo";

/**
 * The site's own pages. Without these the price, gallery and contact
 * pages were reachable only through the sitemap — the header links to
 * anchors on the home page, as the Figma has it.
 */
const pageLinks = [
  { to: "/prices", key: "nav.prices" },
  { to: "/gallery", key: "nav.gallery" },
  { to: "/contact", key: "nav.contact" },
] as const;

/**
 * The Figma footer is a single indigo band: the wordmark on the left and
 * the page and legal links on the right. "Cookie-Einstellungen" is added to that
 * row — the consent decision has to stay changeable from every page —
 * but only while there is a decision to make (see CookieBanner).
 */
const legalLinks = [
  { to: "/imprint", key: "footer.imprint" },
  { to: "/datenschutz", key: "footer.privacy" },
  { to: "/terms", key: "footer.terms" },
  { to: "/appointment-terms", key: "footer.appointmentTerms" },
  { to: "/package-terms", key: "footer.packageTerms" },
  { to: "/mission", key: "footer.mission" },
] as const;

const linkClass =
  "text-sm font-medium text-white/80 transition-colors hover:text-white";

const pageLinkClass = "text-base font-semibold text-white transition-colors hover:text-white/80";

export default function Footer() {
  const { t } = useTranslation();
  const { openSettings } = useConsent();
  return (
    <footer className="pt-16">
      {/* The indigo band spans the viewport; only its content keeps the
          1200px column of the rest of the page. */}
      <div className="rounded-t-panel bg-brand-700 py-10 sm:py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-7 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Logo variant="light" />
            <p className="mt-2 text-xs text-white/60">
              © {new Date().getFullYear()} {business.name}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {/* Pages first, then the legal row — the order a visitor looks for them. */}
            <nav aria-label={t("footer.pagesLabel")}>
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {pageLinks.map((link) => (
                  <li key={link.to}>
                    <LocalizedLink to={link.to} className={pageLinkClass}>
                      {t(link.key)}
                    </LocalizedLink>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label={t("footer.label")}>
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {legalLinks.map((link) => (
                  <li key={link.to}>
                    <LocalizedLink to={link.to} className={linkClass}>
                      {t(link.key)}
                    </LocalizedLink>
                  </li>
                ))}
                <li>
                  {/* Static file served by nginx, not a router route — plain <a>. */}
                  <a href="/sitemap.xml" className={linkClass}>
                    {t("footer.sitemap")}
                  </a>
                </li>
                {features.altegio && (
                  <li>
                    <button type="button" onClick={openSettings} className={linkClass}>
                      {t("footer.cookieSettings")}
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
