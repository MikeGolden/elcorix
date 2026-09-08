import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon, ChevronRightIcon } from "../components/icons";
import Lightbox from "../components/Lightbox";
import { images } from "../images";

/**
 * "Sehen Sie sich unsere Arbeiten an" — a horizontal slider of portrait
 * tiles. The track is a native scroll-snap list (so touch swiping and
 * keyboard scrolling work without a carousel library); the arrows page
 * it by one tile and disable themselves at either end.
 *
 * Each tile is a button that opens the photo full screen in <Lightbox>,
 * which then pages through the same set with its own arrows and keys.
 */
export default function Works() {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const slides = useMemo(
    () =>
      images.work.map((src, index) => ({
        src,
        alt: t(`work.alts.n${index + 1}` as "work.alts.n1"),
      })),
    [t],
  );

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
          {slides.map((slide, index) => (
            <li
              key={slide.src}
              className="w-[72%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-3.75rem)/4)]"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={t("lightbox.open", { name: slide.alt })}
                data-testid={`work-tile-${index + 1}`}
                className="group block w-full cursor-zoom-in overflow-hidden rounded-panel
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700
                           focus-visible:ring-offset-2"
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  width="760"
                  height="1064"
                  loading="lazy"
                  className="aspect-[5/7] w-full rounded-panel object-cover transition-transform
                             duration-300 group-hover:scale-[1.03]"
                />
              </button>
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

      <Lightbox
        images={slides}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </section>
  );
}
