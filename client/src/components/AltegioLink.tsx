import type { ReactNode } from "react";
import { altegioLinks } from "../business";

/**
 * An outbound link into Altegio's online booking, opened in a new tab so
 * the visitor keeps the price page. A plain <a>: nothing loads from Altegio
 * until it is clicked, unlike the consent-gated embed (AltegioWidget).
 */
export default function AltegioLink({
  to,
  className,
  ariaLabel,
  children,
}: {
  to: keyof typeof altegioLinks;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={altegioLinks[to]}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      data-altegio={to}
      className={className}
    >
      {children}
    </a>
  );
}
