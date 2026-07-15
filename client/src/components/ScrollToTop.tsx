import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router keeps the scroll position across client-side navigations —
 * without this, clicking "Book" at the bottom of the home page lands the
 * visitor mid-way down /booking. In-page anchor jumps (hash links) are
 * left to the browser.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash === "") window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
