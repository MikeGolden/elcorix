import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Lightbox from "../components/Lightbox";
import { images } from "../images";
import { usePageMeta } from "../seo/usePageMeta";

/**
 * The four tiles of the Figma's "Sehen Sie sich unsere Arbeiten an"
 * section, plus the hero, device and specialist photos — every image on
 * this page comes from the studio's own set, nothing else. Each tile
 * opens full screen in <Lightbox>.
 */
const galleryItems = [
  { src: images.hero, altKey: "hero" },
  ...images.work.map((src, index) => ({ src, altKey: `n${index + 1}` })),
  { src: images.technology, altKey: "technology" },
  { src: images.specialist, altKey: "specialist" },
] as const;

export default function GalleryPage() {
  const { t } = useTranslation();
  usePageMeta("gallery");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const slides = useMemo(
    () =>
      galleryItems.map((item) => ({
        src: item.src,
        alt: t(`gallery.alts.${item.altKey}` as "gallery.alts.hero"),
      })),
    [t],
  );

  return (
    <section
      aria-labelledby="gallery-title"
      className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20"
    >
      <h1 id="gallery-title" className="text-3xl font-extrabold sm:text-4xl">
        {t("gallery.title")}
      </h1>
      <p className="mt-5 max-w-2xl text-[0.95rem] leading-relaxed">{t("gallery.intro")}</p>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((slide, index) => (
          <li key={`${slide.src}-${index}`}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={t("lightbox.open", { name: slide.alt })}
              className="group block w-full cursor-zoom-in overflow-hidden rounded-panel
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700
                         focus-visible:ring-offset-2"
            >
              <img
                src={slide.src}
                alt={slide.alt}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-panel object-cover transition-transform
                           duration-300 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <Lightbox
        images={slides}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </section>
  );
}
