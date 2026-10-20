import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon, ChevronRightIcon } from "../components/icons";
import Photo from "../components/Photo";
import Reveal from "../components/Reveal";
import { images } from "../images";

type Zone = (typeof images.results)[number]["zone"];

const pill =
  "pointer-events-none absolute bottom-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700";

/**
 * One photo, two states: "after" underneath, "before" on top clipped to the
 * slider position. The slider is a native range input stretched invisibly
 * over the photo, so dragging, tapping, arrow keys and screen readers all
 * work without pointer-event code; the line and handle only draw it.
 */
function Comparison({ zone, before, after }: { zone: Zone; before: string; after: string }) {
  const { t } = useTranslation();
  const [position, setPosition] = useState(50);
  const name = t(`results.zones.${zone}`);
  const photo = "absolute inset-0 h-full w-full object-cover";

  return (
    <div className="relative aspect-[4/3] select-none overflow-hidden rounded-panel">
      <Photo src={after} alt={t("results.afterAlt", { name })} loading="lazy" decoding="async" className={photo} />
      <Photo
        src={before}
        alt={t("results.beforeAlt", { name })}
        loading="lazy"
        decoding="async"
        className={photo}
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label={t("results.slider", { name })}
        className="peer absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white
                   peer-focus-visible:[&>span]:ring-2 peer-focus-visible:[&>span]:ring-brand-700"
        style={{ left: `${position}%` }}
      >
        <span
          className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center
                     justify-center rounded-full bg-white text-brand-700 shadow-[0_1px_4px_rgba(20,32,63,0.2)]"
        >
          <ChevronLeftIcon className="-mr-1 h-3.5 w-3.5" />
          <ChevronRightIcon className="-ml-1 h-3.5 w-3.5" />
        </span>
      </div>
      <span aria-hidden="true" className={`${pill} left-3`}>
        {t("results.before")}
      </span>
      <span aria-hidden="true" className={`${pill} right-3`}>
        {t("results.after")}
      </span>
    </div>
  );
}

/** "Echte Ergebnisse" — before/after sliders, one per treatment zone. */
export default function Results() {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby="results-title"
      className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6 sm:pb-20"
    >
      <Reveal as="h2" id="results-title" className="text-center text-2xl font-bold sm:text-3xl">
        {t("results.title")}
      </Reveal>
      <Reveal as="p" className="mx-auto mt-3 max-w-xl text-center text-ink-500" delay={60}>
        {t("results.subtitle")}
      </Reveal>
      <Reveal as="ul" className="mt-9 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4" delay={90}>
        {images.results.map((pair) => (
          <li key={pair.zone}>
            <Comparison {...pair} />
          </li>
        ))}
      </Reveal>
    </section>
  );
}
