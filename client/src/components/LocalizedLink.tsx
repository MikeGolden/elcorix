import { Link, type LinkProps } from "react-router-dom";
import { useLocalizedPath } from "../i18n/useLanguage";

/**
 * `<Link>` that keeps the visitor in their language: `to="/prices"` renders
 * as `/de/prices` for a German visitor. Every in-app link goes through this
 * — a bare `<Link to="/prices">` would drop the language segment and bounce
 * the visitor through the redirect back to their stored preference.
 */
export default function LocalizedLink({ to, ...props }: Omit<LinkProps, "to"> & { to: string }) {
  const localize = useLocalizedPath();
  return <Link to={localize(to)} {...props} />;
}
