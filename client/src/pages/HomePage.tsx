import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { business } from "../config";
import { images } from "../images";
import { usePageMeta } from "../seo/usePageMeta";

const serviceKeys = [
  "facial",
  "permanentMakeup",
  "laser",
  "nails",
  "lashesBrows",
  "body",
] as const;

const advantageKeys = ["consultation", "hygiene", "technology", "location"] as const;

const testimonialKeys = ["t1", "t2", "t3"] as const;

/** Placeholder names — swap for the real team before going live. */
const teamMembers = [
  { name: business.owner, roleKey: "founder", image: images.team.founder },
  { name: "Lena Beispiel", roleKey: "esthetician", image: images.team.esthetician },
  { name: "Marta Muster", roleKey: "nails", image: images.team.nails },
] as const;

const solidCta =
  "inline-block bg-brand-500 px-10 py-4 text-xs font-medium uppercase tracking-[0.22em] text-brand-50 transition-colors hover:bg-brand-600";
const outlineCta =
  "inline-block border border-brand-500 px-10 py-4 text-xs font-medium uppercase tracking-[0.22em] text-brand-700 transition-colors hover:bg-brand-500 hover:text-brand-50";

export default function HomePage() {
  const { t } = useTranslation();
  usePageMeta("home");
  return (
    <>
      {/* Hero — full-bleed editorial portrait, my-skinclinic style */}
      <section className="relative min-h-[560px] overflow-hidden border-b border-brand-200/70 bg-brand-100 sm:h-[86vh]">
        <img
          src={images.hero}
          alt=""
          width="1900"
          height="1267"
          // React 18 only forwards the lowercase DOM attribute form.
          {...{ fetchpriority: "high" }}
          className="absolute inset-0 h-full w-full object-cover object-[50%_25%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-brand-50 via-brand-50/30 to-transparent"
        />
        <div className="relative flex h-full min-h-[560px] flex-col justify-end">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-40 sm:px-6 sm:pb-20">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-brand-600">
              Füssen · Allgäu
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-light uppercase tracking-[0.22em] text-brand-900 sm:text-6xl">
              {business.name}
            </h1>
            <p className="mt-4 max-w-xl font-display text-2xl italic leading-relaxed text-brand-700">
              {t("hero.tagline")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/booking" className={solidCta}>
                {t("hero.cta")}
              </Link>
              <Link to="/contact" className={outlineCta}>
                {t("nav.contact")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages strip */}
      <section aria-labelledby="advantages" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 id="advantages" className="sr-only">
          {t("home.advantages.title")}
        </h2>
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {advantageKeys.map((key, index) => (
            <li key={key} className="border-t border-brand-300 pt-5">
              <span
                aria-hidden="true"
                className="font-display text-2xl italic text-brand-500"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-sm font-medium uppercase tracking-[0.15em] text-brand-900">
                {t(`home.advantages.items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-brand-700">
                {t(`home.advantages.items.${key}.text`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* What we do — photo cards with label bar, mdclinica style */}
      <section aria-labelledby="what-we-do" className="border-y border-brand-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <div aria-hidden="true" className="mx-auto h-px w-12 bg-brand-500" />
            <h2
              id="what-we-do"
              className="mt-6 font-display text-4xl font-medium text-brand-900 sm:text-5xl"
            >
              {t("home.whatWeDo.title")}
            </h2>
          </div>
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {serviceKeys.map((key) => (
              <li key={key} className="group flex flex-col border border-brand-200/70 bg-white">
                <div className="relative overflow-hidden">
                  <img
                    src={images.services[key]}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-brand-50/95 px-5 py-3">
                    <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-brand-900">
                      {t(`services.${key}.title`)}
                    </h3>
                  </div>
                </div>
                <p className="px-5 py-4 text-sm font-light leading-relaxed text-brand-700">
                  {t(`services.${key}.description`)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-14 text-center">
            <Link to="/booking" className={outlineCta}>
              {t("home.whatWeDo.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Who we are — editorial split with interior photo */}
      <section aria-labelledby="who-we-are" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <img
            src={images.interior}
            alt=""
            loading="lazy"
            className="aspect-[4/5] w-full object-cover md:aspect-[3/4]"
          />
          <div>
            <div aria-hidden="true" className="h-px w-12 bg-brand-500" />
            <h2
              id="who-we-are"
              className="mt-6 font-display text-4xl font-medium text-brand-900 sm:text-5xl"
            >
              {t("home.whoWeAre.title")}
            </h2>
            <p className="mt-8 font-light leading-loose text-brand-700">
              {t("home.whoWeAre.p1")}
            </p>
            <p className="mt-6 font-light leading-loose text-brand-700">
              {t("home.whoWeAre.p2")}
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section aria-labelledby="team" className="border-y border-brand-200/70 bg-brand-100">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <div aria-hidden="true" className="mx-auto h-px w-12 bg-brand-500" />
            <h2
              id="team"
              className="mt-6 font-display text-4xl font-medium text-brand-900 sm:text-5xl"
            >
              {t("home.team.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-light leading-relaxed text-brand-700">
              {t("home.team.intro")}
            </p>
          </div>
          <ul className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-3">
            {teamMembers.map((member) => (
              <li key={member.roleKey} className="text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover"
                />
                <h3 className="mt-5 font-display text-2xl font-medium text-brand-900">
                  {member.name}
                </h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-brand-600">
                  {t(`home.team.roles.${member.roleKey}`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials — curated quotes (update with real reviews). */}
      <section aria-labelledby="testimonials" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center">
          <div aria-hidden="true" className="mx-auto h-px w-12 bg-brand-500" />
          <h2
            id="testimonials"
            className="mt-6 font-display text-4xl font-medium text-brand-900 sm:text-5xl"
          >
            {t("home.testimonials.title")}
          </h2>
        </div>
        <ul className="mt-14 grid gap-10 md:grid-cols-3">
          {testimonialKeys.map((key) => (
            <li key={key} className="border-t border-brand-300 pt-6">
              <blockquote className="font-display text-xl italic leading-relaxed text-brand-700">
                “{t(`home.testimonials.items.${key}.quote`)}”
              </blockquote>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-brand-600">
                {t(`home.testimonials.items.${key}.name`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA band — full-bleed photo with booking call-to-action */}
      <section aria-labelledby="cta-band" className="relative overflow-hidden">
        <img
          src={images.ctaBand}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-brand-900/50" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <h2
            id="cta-band"
            className="font-display text-4xl font-medium text-brand-50 sm:text-5xl"
          >
            {t("home.ctaBand.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-light leading-relaxed text-brand-100">
            {t("home.ctaBand.text")}
          </p>
          <Link
            to="/booking"
            className="mt-10 inline-block bg-brand-50 px-10 py-4 text-xs font-medium uppercase tracking-[0.22em] text-brand-900 transition-colors hover:bg-brand-100"
          >
            {t("hero.cta")}
          </Link>
        </div>
      </section>
    </>
  );
}
