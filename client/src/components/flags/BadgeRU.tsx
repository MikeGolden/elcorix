import type { FlagProps } from "./types";

/**
 * Russian is offered as a *language*, not as a country: a large part of the
 * clientele that reads it is Ukrainian, and putting the Russian tricolour
 * next to "Українська" in the same list reads as a statement nobody asked
 * this studio to make. So this option gets a neutral lettered badge instead
 * of a flag. Same 60×40 box as the flags, so it sits in the switcher's
 * `flagClass` slot without any layout special-casing.
 */
export default function BadgeRU({ className }: FlagProps) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="60" height="40" fill="#EEF1F6" />
      <text
        x="30"
        y="27"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="20"
        fontWeight="700"
        letterSpacing="1"
        fill="#3C4A66"
      >
        RU
      </text>
    </svg>
  );
}
