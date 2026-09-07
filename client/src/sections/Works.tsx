import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon, ChevronRightIcon } from "../components/icons";
import { images } from "../images";

/**
 * "Sehen Sie sich unsere Arbeiten an" — a horizontal slider of portrait
 * tiles. The track is a native scroll-snap list (so touch swiping and
 * keyboard scrolling work without a carousel library); the arrows page
 * it by one tile and disable themselves at either end.
 */
export default function Works() {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const syncArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setAtStart(track.scrollLeft <= 1);
    // `max <= 1` means everything fits — both arrows stay disabled.
    setAtEnd(track.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    syncArrows();
    window.addEventListener("resize", syncArrows);
    return () => window.removeEventListener("resize", syncArrows);
  }, [syncArrows]);

  const page = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const step = track.firstElementChild?.clientWidth ?? track.clientWidth;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (step + gap), behavior: "smooth" });
  };

  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20"
    >
      <h2 id="work-title" className="text-center text-2xl font-bold sm:text-3xl">
        {t("work.title")}
      </h2>

      <div className="relative mt-9">
        <ul
          ref={trackRef}
          onScroll={syncArrows}
          tabIndex={0}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth
                     [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5
                     [&::-webkit-scrollbar]:hidden"
        >
          {images.work.map((src, index) => (
            <li
              key={src}
              className="w-[72%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-3.75rem)/4)]"
            >
              <img
                src={src}
                alt={t(`work.alts.n${index + 1}` as "work.alts.n1")}
                width="760"
                height="1064"
                loading="lazy"
                className="aspect-[5/7] w-full rounded-panel object-cover"
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => page(-1)}
          disabled={atStart}
          aria-label={t("work.prev")}
          className="absolute left-1 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center
                     justify-center rounded-full border border-line bg-white/90 text-brand-700
                     shadow-sm backdrop-blur transition enabled:hover:bg-white
                     disabled:pointer-events-none disabled:opacity-0 sm:-left-2 sm:flex"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          onClick={() => page(1)}
          disabled={atEnd}
          aria-label={t("work.next")}
          className="absolute right-1 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center
                     justify-center rounded-full border border-line bg-white/90 text-brand-700
                     shadow-sm backdrop-blur transition enabled:hover:bg-white
                     disabled:pointer-events-none disabled:opacity-0 sm:-right-2 sm:flex"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </section>
  );
}
