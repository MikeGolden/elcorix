import { useTranslation } from "react-i18next";
import { images } from "../images";
import { usePageMeta } from "../seo/usePageMeta";

const galleryItems = [
  { src: images.interior, altKey: "interior" },
  { src: images.services.facial, altKey: "facial" },
  { src: images.services.permanentMakeup, altKey: "permanentMakeup" },
  { src: images.services.laser, altKey: "laser" },
  { src: images.services.nails, altKey: "nails" },
  { src: images.services.lashesBrows, altKey: "lashesBrows" },
  { src: images.services.body, altKey: "body" },
  { src: images.ctaBand, altKey: "studio" },
] as const;

export default function GalleryPage() {
  const { t } = useTranslation();
  usePageMeta("gallery");
  return (
    <section aria-labelledby="gallery" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div aria-hidden="true" className="h-px w-12 bg-brand-500" />
      <h1
        id="gallery"
        className="mt-6 font-display text-4xl font-medium text-brand-900 sm:text-5xl"
      >
        {t("gallery.title")}
      </h1>
      <p className="mt-5 max-w-2xl font-light leading-loose text-brand-700">
        {t("gallery.intro")}
      </p>
      <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {galleryItems.map((item) => (
          <li key={item.altKey} className="overflow-hidden border border-brand-200/70 bg-white">
            <img
              src={item.src}
              alt={t(`gallery.alts.${item.altKey}`)}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
