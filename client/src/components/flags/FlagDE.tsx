import type { FlagProps } from "./types";

/** German tricolour (decorative icon). */
export default function FlagDE({ className }: FlagProps) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="60" height="14" y="0" fill="#000000" />
      <rect width="60" height="13" y="14" fill="#DD0000" />
      <rect width="60" height="13" y="27" fill="#FFCE00" />
    </svg>
  );
}
