/**
 * The landing page is a one-pager with anchor navigation, but the deep
 * routes (/prices, /gallery, …) reuse the same sections. A menu entry
 * therefore has to jump within the page on "/" and navigate home
 * everywhere else.
 */
export function anchorHref(pathname: string, id: string): string {
  return pathname === "/" ? `#${id}` : `/#${id}`;
}
