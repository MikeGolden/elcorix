import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { images } from "../images";
import { anchorHref } from "../anchors";

export default function Hero() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
        <div>
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
        </div>

        <img
          src={images.hero}
          alt={t("hero.imageAlt")}
          width="1600"
          height="1000"
          // React 18 only forwards the lowercase DOM attribute form.
          {...{ fetchpriority: "high" }}
          className="aspect-[16/10] w-full rounded-panel object-cover"
        />
      </div>
    </section>
  );
}
