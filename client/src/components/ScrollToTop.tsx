import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router keeps the scroll position across client-side navigations —
 * without this, clicking a link at the bottom of the home page lands the
 * visitor mid-way down the next route. Hash links are handled here too:
 * the browser only auto-scrolls on a real document load, so a client-side
 * jump to `/#prices` has to scroll the target into view itself.
 *
 * Keyed on `location.key`, not just pathname/hash: clicking a link to the
 * anchor you are already on (a second "Get a consultation" after scrolling
 * away) leaves pathname and hash unchanged, but React Router still pushes a
 * new location with a fresh key — so the jump fires every time.
 */
export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (hash === "") {
      window.scrollTo(0, 0);
      return;
    }
    // Let the route render before looking for the anchor target.
    const id = decodeURIComponent(hash.slice(1));
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash, key]);
  return null;
}
