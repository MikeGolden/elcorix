import { useTranslation } from "react-i18next";
import { images } from "../images";
import { usePageMeta } from "../seo/usePageMeta";

const galleryItems = [
  { src: images.hero, altKey: "hero" },
  ...images.work.map((src, index) => ({ src, altKey: `n${index + 1}` })),
  { src: images.technology, altKey: "technology" },
  { src: images.specialist, altKey: "specialist" },
] as const;

export default function GalleryPage() {
  const { t } = useTranslation();
  usePageMeta("gallery");
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
        {galleryItems.map((item, index) => (
          <li key={`${item.altKey}-${index}`}>
            <img
              src={item.src}
              alt={t(`gallery.alts.${item.altKey}` as "gallery.alts.hero")}
              loading="lazy"
              className="aspect-[4/3] w-full rounded-panel object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
