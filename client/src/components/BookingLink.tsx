import type { ReactNode } from "react";
import { Link } from "react-router";
import LocalizedLink from "./LocalizedLink";
import { features } from "../config";
import { useAnchorHref } from "../i18n/useLanguage";

/**
 * Every booking button on /prices ("Ersttermin buchen", "Termin buchen")
 * goes through here, so they all land in the same place: /booking while
 * the Altegio flag is on (src/features.ts), otherwise the consultation
 * request on the landing page, which needs no third party.
 */
export default function BookingLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const anchor = useAnchorHref();
  return features.altegio ? (
    <LocalizedLink to="/booking" className={className}>
      {children}
    </LocalizedLink>
  ) : (
    <Link to={anchor("consultation")} className={className}>
      {children}
    </Link>
  );
}
