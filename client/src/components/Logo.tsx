import { Link } from "react-router-dom";
import { business } from "../config";

/**
 * The elcorix wordmark. The Figma uses a custom bold-italic script logo —
 * this is a type-set stand-in with the same weight and slant. Drop the
 * real SVG in here (keeping the <Link> wrapper and the aria-label) once
 * the brand asset is available.
 */
export default function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <Link
      to="/"
      aria-label={business.name}
      className={`font-display text-2xl font-extrabold italic tracking-[-0.03em] transition-opacity hover:opacity-80 ${
        variant === "light" ? "text-white" : "text-brand-700"
      }`}
    >
      {business.name}
    </Link>
  );
}
