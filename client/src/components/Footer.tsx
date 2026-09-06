import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { business } from "../config";
import { useConsent } from "../consent/ConsentContext";
import Logo from "./Logo";

/**
 * The Figma footer is a single indigo band: the wordmark on the left and
 * the legal links on the right. "Cookie-Einstellungen" is added to that
 * row — the consent decision has to stay changeable from every page.
 */
const legalLinks = [
  { to: "/imprint", key: "footer.imprint" },
  { to: "/privacy", key: "footer.privacy" },
  { to: "/terms", key: "footer.terms" },
  { to: "/mission", key: "footer.mission" },
] as const;

const linkClass =
  "text-sm font-medium text-white/80 transition-colors hover:text-white";

export default function Footer() {
  const { t } = useTranslation();
  const { openSettings } = useConsent();
  return (
    <footer className="px-4 pb-0 pt-16 sm:px-6">
      <div className="mx-auto max-w-[1200px] rounded-t-panel bg-brand-700 px-6 py-10 sm:px-10 sm:py-12">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Logo variant="light" />
            <p className="mt-2 text-xs text-white/60">
              © {new Date().getFullYear()} {business.name}
            </p>
          </div>
          <nav aria-label={t("footer.label")}>
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {t(link.key)}
                  </Link>
                </li>
              ))}
              <li>
                <button type="button" onClick={openSettings} className={linkClass}>
                  {t("footer.cookieSettings")}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
