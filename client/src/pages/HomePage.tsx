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
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-100 to-brand-50">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {business.name}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-700">
            {t("hero.tagline")}
          </p>
          <Link
            to="/booking"
            className="mt-8 inline-block rounded-full bg-brand-600 px-8 py-3 font-medium text-white shadow hover:bg-brand-700"
          >
            {t("hero.cta")}
          </Link>
        </div>
      </section>

      {/* Who we are */}
      <section aria-labelledby="who-we-are" className="mx-auto max-w-5xl px-4 py-16">
        <h2 id="who-we-are" className="text-3xl font-semibold">
          {t("home.whoWeAre.title")}
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <p className="leading-relaxed text-brand-700">{t("home.whoWeAre.p1")}</p>
          <p className="leading-relaxed text-brand-700">{t("home.whoWeAre.p2")}</p>
        </div>
      </section>

      {/* What we do */}
      <section aria-labelledby="what-we-do" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 id="what-we-do" className="text-3xl font-semibold">
            {t("home.whatWeDo.title")}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {serviceKeys.map((key) => (
              <li
                key={key}
                className="rounded-2xl border border-brand-100 bg-brand-50 p-6"
              >
                <h3 className="font-semibold">{t(`services.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-700">
                  {t(`services.${key}.description`)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Link
              to="/booking"
              className="inline-block rounded-full border border-brand-600 px-8 py-3 font-medium text-brand-600 hover:bg-brand-100"
            >
              {t("home.whatWeDo.cta")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
