import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Persistent "book" call-to-action pinned to the left edge on larger
 * screens (same usability pattern as my-skinclinic.de's TERMIN BUCHEN
 * button). Hidden on the booking page itself and on small screens,
 * where the header link and hero button already cover it.
 */
export default function FloatingBookCta() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  if (pathname === "/booking") return null;

  return (
    <Link
      to="/booking"
      className="fixed left-0 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-3 border border-l-0 border-brand-200 bg-brand-50/95 py-4 pl-6 pr-5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-brand-900 shadow-[0_2px_16px_rgba(0,0,0,0.6)] backdrop-blur transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-brand-50 lg:flex"
    >
      {t("hero.cta")}
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" focusable="false">
        <path
          d="M6 6l8 8m0 0v-6m0 6H8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    </Link>
  );
}
