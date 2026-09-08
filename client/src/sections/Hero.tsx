import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";
import { images } from "../images";
import { anchorHref } from "../anchors";

/**
 * Hero of the Figma one-pager: the copy sits in the 1200px column while
 * the photo bleeds to the right edge of the viewport and runs the full
 * height of the block, up behind the (transparent) header — so the
 * header buttons sit on the photo and there is no divider between them.
 *
 * Everything here is above the fold, so the reveals fire on load: headline
 * first, then the button, the photo and the service teaser, ~90ms apart.
 * The photo only fades — sliding a half-viewport image that is pinned to
 * the right edge reads as a glitch, not as motion.
 */
export default function Hero() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
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
          to={anchorHref(pathname, "booking")}
          className="btn-primary mt-8"
        >
          {t("cta.book")}
        </Reveal>

        <Reveal className="mt-12" delay={270}>
          <p className="text-sm font-bold text-brand-700">{t("hero.servicesLabel")}</p>
          <Link
            to="/prices"
            className="mt-4 inline-flex items-center gap-4 rounded-panel p-2 pr-6 transition-colors hover:bg-surface-soft"
          >
            <img
              src={images.serviceThumb}
              alt=""
              width="320"
              height="320"
              className="h-14 w-14 rounded-2xl object-cover"
            />
            <span className="text-[0.95rem]">
              <span className="font-bold text-brand-700">{t("hero.serviceName")}</span>{" "}
              <span className="text-ink-300">{t("hero.serviceCount")}</span>
            </span>
          </Link>
        </Reveal>

        <Reveal
          as="img"
          variant="fade"
          delay={180}
          src={images.hero}
          alt={t("hero.imageAlt")}
          width="1600"
          height="1000"
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
