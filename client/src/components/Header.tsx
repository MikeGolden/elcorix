import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { business } from "../config";
import LanguageSwitcher from "./LanguageSwitcher";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-1 py-2 text-xs font-medium uppercase tracking-[0.2em] transition-colors ${
    isActive
      ? "text-brand-900 underline decoration-brand-500 underline-offset-8"
      : "text-brand-700 hover:text-brand-900"
  }`;

export default function Header() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-10 border-b border-brand-200/70 bg-brand-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="order-1 text-lg font-light uppercase tracking-[0.3em] text-brand-900"
        >
          {business.name}
        </Link>
        {/* Full-width second row on mobile so long German/Ukrainian labels
            never collide with the brand or the language switcher. */}
        <nav
          aria-label={t("nav.label")}
          className="order-3 flex w-full flex-wrap items-center gap-x-6 gap-y-1 sm:order-2 sm:w-auto"
        >
          <NavLink to="/" end className={navLinkClass}>
            {t("nav.home")}
          </NavLink>
          <NavLink to="/booking" className={navLinkClass}>
            {t("nav.booking")}
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            {t("nav.contact")}
          </NavLink>
        </nav>
        <div className="order-2 flex items-center gap-4 sm:order-3">
          <a
            href={`tel:${business.phone.replace(/\s/g, "")}`}
            className="hidden text-xs font-medium uppercase tracking-[0.15em] text-brand-700 transition-colors hover:text-brand-900 md:inline"
          >
            {business.phone}
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
