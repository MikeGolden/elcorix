import { useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";

const iconProps = {
  viewBox: "0 0 24 24",
  // Sized to the title plus a two-line text; the stroke is thinned to
  // keep the line weight it had at 28px.
  className: "h-16 w-16 shrink-0 text-brand-700",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 0.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
} as const;

const points = [
  {
    key: "permanent",
    icon: (
      <svg {...iconProps}>
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
        <path d="M16 8 2 22M17.5 15H9" />
      </svg>
    ),
  },
  {
    key: "safe",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: "technology",
    icon: (
      <svg {...iconProps}>
        <path d="M6 3h12l4 6-10 12L2 9z" />
        <path d="M2 9h20M10 3 8 9l4 12 4-12-2-6" />
      </svg>
    ),
  },
  {
    key: "life",
    icon: (
      <svg {...iconProps}>
        <path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 8 2.5C20 15.4 12 20 12 20z" />
      </svg>
    ),
  },
] as const;

/** Four reasons to trust the studio, as a row under the work gallery. */
export default function TrustPoints() {
  const { t } = useTranslation();
  return (
    <section
      aria-label={t("trust.label")}
      className="mx-auto max-w-[1200px] px-4 sm:px-6"
    >
      <Reveal
        as="ul"
        className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {points.map((point) => (
          <li key={point.key} className="flex items-start gap-4">
            {point.icon}
            <div>
              <h3 className="text-[0.95rem] font-bold leading-snug text-ink-900">
                {t(`trust.items.${point.key}.title`)}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                {t(`trust.items.${point.key}.text`)}
              </p>
            </div>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
