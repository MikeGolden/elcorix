import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { business } from "../config";
import LanguageSwitcher from "./LanguageSwitcher";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-brand-600 text-white"
      : "text-brand-700 hover:bg-brand-100"
  }`;

export default function Header() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link to="/" className="order-1 text-lg font-semibold tracking-tight">
          {business.name}
        </Link>
        {/* Full-width second row on mobile so long German/Ukrainian labels
            never collide with the brand or the language switcher. */}
        <nav
          aria-label={t("nav.label")}
          className="order-3 flex w-full flex-wrap items-center gap-1 sm:order-2 sm:w-auto"
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
        <div className="order-2 sm:order-3">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
