type IconProps = { className?: string };

/** All icons inherit `currentColor` and are decorative by default. */
const base = { "aria-hidden": true, focusable: "false" } as const;

export function ArrowRightIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base}>
      <path
        d="M4 10h11m0 0-4-4m4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WhatsAppIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path
        fill="currentColor"
        d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.24h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.88 9.88 0 0 0 12.04 2Zm0 1.82c2.18 0 4.22.85 5.76 2.39a8.08 8.08 0 0 1 2.38 5.75c0 4.5-3.65 8.14-8.14 8.14a8.1 8.1 0 0 1-4.14-1.13l-.3-.18-3.08.81.82-3.01-.19-.31a8.1 8.1 0 0 1-1.24-4.32c0-4.49 3.65-8.14 8.13-8.14Zm-2.6 4.03c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.16 2.95c.14.19 1.98 3.02 4.8 4.24.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.65-.67 1.88-1.33.23-.65.23-1.21.16-1.33-.07-.11-.26-.18-.55-.32-.29-.15-1.65-.82-1.91-.91-.26-.1-.44-.15-.63.14-.19.29-.72.91-.88 1.1-.16.19-.32.21-.61.07-.29-.15-1.19-.44-2.27-1.4-.84-.75-1.4-1.67-1.57-1.96-.16-.29-.02-.44.13-.59.13-.13.29-.34.44-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.63-1.55-.88-2.12-.21-.5-.43-.5-.61-.51h-.53Z"
      />
    </svg>
  );
}

export function MenuIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base}>
      <path
        d="M3 6h14M3 10h14M3 14h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base}>
      <path
        d="M5 5l10 10M15 5L5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base}>
      <path
        d="M4 10.5l4 4 8-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base}>
      <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
