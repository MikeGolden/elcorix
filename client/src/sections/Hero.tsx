import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";
import Photo, { webpFor } from "../components/Photo";
import { images } from "../images";
import LocalizedLink from "../components/LocalizedLink";
import { useAnchorHref } from "../i18n/useLanguage";

/**
 * Hero of the Figma one-pager: the copy sits in the 1200px column while
 * the photo bleeds to the right edge of the viewport and runs the full
 * height of the block, up behind the (transparent) header — so the
 * header buttons sit on the photo and there is no divider between them.
 *
 * Everything here is above the fold, so the reveals fire on load: headline
 * first, then the button and the service teaser, ~90ms apart.
 *
 * The photo is deliberately NOT revealed. It is the LCP element, and an
 * element at `opacity: 0` does not count as painted — wrapping it in
 * <Reveal> pushed the largest paint behind React mounting, the observer
 * firing, a 180ms stagger and a 650ms fade. It is preloaded in index.html
 * and painted as soon as it decodes.
 */
export default function Hero() {
  const { t } = useTranslation();
  const anchor = useAnchorHref();
  return (
    // -mt-19/pt-19 = the header's height: the section starts under the
    // header without moving any of its content. The copy's right padding
    // keeps it clear of the photo, which covers the right half of the
    // *viewport*: below 1200px that is 50vw + a gutter, and above it the
    // centred container only ever overlaps the photo by 600px, so the
    // padding caps at 640px — a plain percentage grew with the screen and
    // squeezed the headline to one word per line.
    <section className="relative -mt-19 pt-19">
      <div className="mx-auto max-w-[1200px] px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:pr-[min(calc(50vw+2.5rem),640px)]">
        <Reveal
          as="h1"
          className="text-[2.1rem] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-5xl lg:text-[3.35rem]"
        >
          {t("hero.title")}
        </Reveal>
        <Reveal
          as={Link}
          delay={90}
          to={anchor("booking")}
          className="btn-primary mt-8"
        >
          {t("cta.book")}
        </Reveal>

        <Reveal className="mt-12" delay={270}>
          <p className="text-sm font-bold text-brand-700">{t("hero.servicesLabel")}</p>
          <LocalizedLink
            to="/prices"
            className="mt-4 inline-flex items-center gap-4 rounded-panel p-2 pr-6 transition-colors hover:bg-surface-soft"
          >
            <Photo
              src={images.serviceThumb}
              alt=""
              width="320"
              height="320"
              loading="lazy"
              decoding="async"
              className="h-14 w-14 rounded-2xl object-cover"
            />
            <span className="text-[0.95rem]">
              <span className="font-bold text-brand-700">{t("hero.serviceName")}</span>{" "}
              <span className="text-ink-300">{t("hero.serviceCount")}</span>
            </span>
          </LocalizedLink>
        </Reveal>

        <Photo
          data-testid="hero-photo"
          src={images.hero}
          // Full-bleed below lg, half the viewport above it: a phone gets
          // the 900px crop (26kB) instead of the 1600px one.
          webpSrcSet={`${images.heroSmall} 900w, ${webpFor(images.hero)} 1600w`}
          sizes="(min-width: 1024px) 50vw, 100vw"
          alt={t("hero.imageAlt")}
          width="1600"
          height="1000"
          decoding="async"
          // React 18 only forwards the lowercase DOM attribute form.
          {...{ fetchpriority: "high" }}
          className="mt-10 aspect-[16/10] w-full rounded-panel object-cover
                     lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:aspect-auto lg:h-full
                     lg:w-1/2 lg:rounded-l-panel lg:rounded-r-none"
        />
      </div>
    </section>
  );
}
