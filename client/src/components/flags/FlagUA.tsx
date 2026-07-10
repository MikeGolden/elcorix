import type { FlagProps } from "./types";

/** Ukrainian bicolour (decorative icon). */
export default function FlagUA({ className }: FlagProps) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="60" height="20" y="0" fill="#0057B7" />
      <rect width="60" height="20" y="20" fill="#FFD700" />
    </svg>
  );
}
