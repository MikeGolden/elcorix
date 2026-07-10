import type { FlagProps } from "./types";

/** Simplified Union Jack (decorative icon). */
export default function FlagGB({ className }: FlagProps) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40 M60 0 0 40" stroke="#ffffff" strokeWidth="8" />
      <path d="M0 0 60 40 M60 0 0 40" stroke="#C8102E" strokeWidth="5" />
      <path d="M30 0 V40 M0 20 H60" stroke="#ffffff" strokeWidth="13" />
      <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth="8" />
    </svg>
  );
}
