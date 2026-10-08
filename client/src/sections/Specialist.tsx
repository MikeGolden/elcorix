import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";
import Photo from "../components/Photo";
import Lightbox from "../components/Lightbox";
import { images, webpSrcSet } from "../images";

const strong = { b: <strong className="font-semibold text-ink-900" /> };

const paragraphs = ["p1", "p2", "p3", "p4"] as const;

// Both tiles in the right column are the same width: full card width on a
// phone, half of it from sm, and a quarter of the 1200px container once
// the card splits at xl.
const tileSizes =
  "(min-width: 1280px) 244px, (min-width: 1200px) 526px, (min-width: 640px) calc(50vw - 74px), calc(100vw - 80px)";

export default function Specialist() {
  const { t } = useTranslation();
  const [certificateOpen, setCertificateOpen] = useState(false);
  const certificate = { src: images.certificate, alt: t("specialist.certificate.alt") };

  return (
    <section
      id="specialist"
      aria-labelledby="specialist-title"
      className="mx-auto max-w-[1200px] px-4 sm:px-6"
    >
      {/* The tinted card rises as one piece — fading its halves separately
          would leave the panel hanging there empty. */}
      <Reveal className="grid items-center gap-10 rounded-panel bg-surface-soft px-6 py-12 sm:px-10 sm:py-14 xl:grid-cols-2 xl:gap-14">
        <div>
          <h2 id="specialist-title" className="text-2xl font-bold sm:text-[1.9rem] sm:leading-tight">
            {t("specialist.title")}
          </h2>
          <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed">
            {paragraphs.map((key) => (
              <p key={key}>
                <Trans i18nKey={`specialist.${key}`} components={strong} />
              </p>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* The A4 scan is unreadable at tile size, so the tile opens it
              full screen; the caption says what it certifies without that. */}
          <figure className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setCertificateOpen(true)}
              aria-label={t("lightbox.open", { name: certificate.alt })}
              data-testid="certificate-tile"
              className="group block w-full cursor-zoom-in overflow-hidden rounded-panel bg-white
                         shadow-[0_1px_3px_rgba(20,32,63,0.06)] focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
            >
              <Photo
                src={certificate.src}
                webpSrcSet={webpSrcSet(images.certificate, 600, 1240)}
                sizes={tileSizes}
                alt={certificate.alt}
                width="1240"
                height="1754"
                loading="lazy"
                decoding="async"
                className="aspect-[1240/1754] w-full object-cover transition-transform duration-300
                           group-hover:scale-[1.03]"
              />
            </button>
            <figcaption className="text-sm leading-snug">
              <span className="block font-semibold text-ink-900">
                {t("specialist.certificate.title")}
              </span>
              <span className="mt-1 block text-ink-500">{t("specialist.certificate.text")}</span>
            </figcaption>
          </figure>
          {/* Below xl the tiles size themselves, so the portrait takes the
              certificate's A4 ratio and both end level. */}
          <Photo
            src={images.specialist}
            webpSrcSet={webpSrcSet(images.specialist, 680, 896)}
            sizes={tileSizes}
            alt={t("specialist.imageAlt")}
            width="896"
            height="1195"
            loading="lazy"
            decoding="async"
            className="h-full min-h-64 w-full rounded-panel object-cover sm:max-xl:aspect-[1240/1754] sm:max-xl:h-auto sm:max-xl:object-top"
          />
        </div>
      </Reveal>

      {/* Outside the <Reveal> on purpose: the lightbox is `fixed` and must
          not sit inside an element that is briefly transformed. */}
      <Lightbox
        images={[certificate]}
        index={certificateOpen ? 0 : null}
        onClose={() => setCertificateOpen(false)}
        onIndexChange={() => {}}
      />
    </section>
  );
}
