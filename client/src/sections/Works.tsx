import { useTranslation } from "react-i18next";
import { images } from "../images";

/**
 * "Sehen Sie sich unsere Arbeiten an" — the Figma shows four portrait
 * tiles filling the content width in a single row; they fold to two
 * columns on narrow screens.
 */
export default function Works() {
  const { t } = useTranslation();
  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20"
    >
      <h2 id="work-title" className="text-center text-2xl font-bold sm:text-3xl">
        {t("work.title")}
      </h2>
      <ul className="mt-9 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {images.work.map((src, index) => (
          <li key={src}>
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
    </section>
  );
}
