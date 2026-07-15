import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { business } from "../config";

const serviceKeys = [
  "facial",
  "permanentMakeup",
  "laser",
  "nails",
  "lashesBrows",
  "body",
] as const;

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <>
      {/* Hero — editorial, ivory-on-ivory with soft bronze glow */}
      <section className="relative overflow-hidden border-b border-brand-200/70 bg-brand-100">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(160,131,85,0.18),transparent)]"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-brand-500">
            Füssen · Allgäu
          </p>
          <h1 className="mt-6 text-4xl font-light uppercase tracking-[0.25em] text-brand-700 sm:text-6xl">
            {business.name}
          </h1>
          <div aria-hidden="true" className="mx-auto mt-8 h-px w-16 bg-brand-500" />
          <p className="mx-auto mt-8 max-w-xl font-display text-2xl italic leading-relaxed text-brand-700">
            {t("hero.tagline")}
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/booking"
              className="inline-block bg-brand-500 px-10 py-4 text-xs font-medium uppercase tracking-[0.22em] text-brand-50 transition-colors hover:bg-brand-600"
            >
              {t("hero.cta")}
            </Link>
            <Link
              to="/contact"
              className="inline-block border border-brand-500 px-10 py-4 text-xs font-medium uppercase tracking-[0.22em] text-brand-700 transition-colors hover:bg-brand-500 hover:text-brand-50"
            >
              {t("nav.contact")}
            </Link>
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section aria-labelledby="who-we-are" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div>
            <div aria-hidden="true" className="h-px w-12 bg-brand-500" />
            <h2
              id="who-we-are"
              className="mt-6 font-display text-4xl font-medium text-brand-900 sm:text-5xl"
            >
              {t("home.whoWeAre.title")}
            </h2>
          </div>
          <div className="grid gap-8 self-center sm:grid-cols-2">
            <p className="font-light leading-loose text-brand-700">
              {t("home.whoWeAre.p1")}
            </p>
            <p className="font-light leading-loose text-brand-700 sm:border-l sm:border-brand-200 sm:pl-8">
              {t("home.whoWeAre.p2")}
            </p>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section aria-labelledby="what-we-do" className="border-y border-brand-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <div aria-hidden="true" className="mx-auto h-px w-12 bg-brand-500" />
            <h2
              id="what-we-do"
              className="mt-6 font-display text-4xl font-medium text-brand-900 sm:text-5xl"
            >
              {t("home.whatWeDo.title")}
            </h2>
          </div>
          <ul className="mt-14 grid gap-px overflow-hidden border border-brand-200/70 bg-brand-200/70 sm:grid-cols-2 lg:grid-cols-3">
            {serviceKeys.map((key, index) => (
              <li
                key={key}
                className="group bg-white p-8 transition-colors hover:bg-brand-50"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-3xl italic text-brand-300 transition-colors group-hover:text-brand-500"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-2xl font-medium text-brand-900">
                  {t(`services.${key}.title`)}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-brand-700">
                  {t(`services.${key}.description`)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-14 text-center">
            <Link
              to="/booking"
              className="inline-block border border-brand-500 px-10 py-4 text-xs font-medium uppercase tracking-[0.22em] text-brand-700 transition-colors hover:bg-brand-500 hover:text-brand-50"
            >
              {t("home.whatWeDo.cta")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
