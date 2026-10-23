import type { ReactNode } from "react";
import { Link } from "react-router";
import { altegioLinks, type AltegioService } from "../business";
import { features } from "../config";
import { useLocalizedPath } from "../i18n/useLanguage";

/**
 * Every booking button on the site ("Termin buchen", "Ersttermin buchen",
 * Bartkontur's "Buchen"). With the Altegio flag on it opens the calendar
 * on /booking, a specific service via `?service=`; with the flag off it
 * falls back to a plain new-tab link into Altegio, which loads nothing on
 * our page and so needs no consent.
 */
export default function BookingLink({
  service = "general",
  className,
  ariaLabel,
  children,
}: {
  service?: AltegioService;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const localize = useLocalizedPath();
  if (!features.altegio) {
    return (
      <a
        href={altegioLinks[service]}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        data-booking={service}
        className={className}
      >
        {children}
      </a>
    );
  }
  const search = service === "general" ? "" : `?service=${service}`;
  return (
    <Link
      to={`${localize("/booking")}${search}`}
      aria-label={ariaLabel}
      data-booking={service}
      className={className}
    >
      {children}
    </Link>
  );
}
