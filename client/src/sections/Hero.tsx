import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { images } from "../images";
import { anchorHref } from "../anchors";

/**
 * Hero of the Figma one-pager: the copy sits in the 1200px column while
 * the photo bleeds to the right edge of the viewport and runs the full
 * height of the block, up behind the (transparent) header — so the
 * header buttons sit on the photo and there is no divider between them.
 */
export default function Hero() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    // -mt-19/pt-19 = the header's height: the section starts under the
    // header without moving any of its content.
    <section className="relative -mt-19 pt-19">
      <div className="mx-auto max-w-[1200px] px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:pr-[55%]">
        <h1 className="text-[2.1rem] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-5xl lg:text-[3.35rem]">
          {t("hero.title")}
        </h1>
        <Link to={anchorHref(pathname, "booking")} className="btn-primary mt-8">
          {t("cta.book")}
        </Link>

        <div className="mt-12">
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
        </div>

        <img
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
