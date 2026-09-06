import { useTranslation } from "react-i18next";
import { images } from "../images";

export default function Works() {
  const { t } = useTranslation();
  return (
    <section id="work" aria-labelledby="work-title" className="py-16 sm:py-20">
      <h2
        id="work-title"
        className="mx-auto max-w-[1200px] px-4 text-center text-2xl font-bold sm:px-6 sm:text-3xl"
      >
        {t("work.title")}
      </h2>
      {/* Horizontal strip, as in the Figma. Scrollable rather than
          auto-playing, so visitors control what they look at.
          `w-max` + `mx-auto` centres the row when it fits and left-aligns it
          when it overflows — `justify-center` would clip the first item. */}
      <div className="mt-8 overflow-x-auto">
        <ul
          className="mx-auto flex w-max snap-x snap-mandatory gap-5 px-4 pb-4 sm:px-6"
          tabIndex={0}
          aria-label={t("work.title")}
        >
          {images.work.map((src, index) => (
            <li key={src} className="shrink-0 snap-start">
              <img
                src={src}
                alt={t(`work.alts.n${index + 1}` as "work.alts.n1")}
                loading="lazy"
                className="h-64 w-48 rounded-panel object-cover sm:h-80 sm:w-60"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
