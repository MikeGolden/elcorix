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
  "inline-block bg-brand-500 px-10 py-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-brand-50 transition-colors hover:bg-brand-600";
const outlineCta =
  "inline-block border border-brand-200 px-10 py-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-brand-900 transition-colors hover:border-brand-500 hover:text-brand-500";

/** Mono section index — the recurring "[ 01 ]" marker of the layout. */
function Kicker({ index }: { index: string }) {
  return (
    <p aria-hidden="true" className="font-mono text-xs tracking-[0.3em] text-brand-500">
      [&nbsp;{index}&nbsp;]
    </p>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  usePageMeta("home");
  return (
    <>
      {/* Hero — full-bleed photo under carbon gradient, oversized display type */}
      <section className="relative min-h-[560px] overflow-hidden border-b border-brand-200 bg-brand-100 sm:h-[88vh]">
        <img
          src={images.hero}
          alt=""
          width="1900"
          height="1267"
          // React 18 only forwards the lowercase DOM attribute form.
          {...{ fetchpriority: "high" }}
          className="absolute inset-0 h-full w-full object-cover object-[50%_25%] opacity-80"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-brand-50 via-brand-50/40 to-brand-50/10"
        />
        <div className="relative flex h-full min-h-[560px] flex-col justify-end">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-40 sm:px-6 sm:pb-20">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-brand-500">
              Füssen · Allgäu
            </p>
            <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-brand-900 sm:text-6xl">
              {business.name}
            </h1>
            <p className="mt-5 max-w-xl font-mono text-sm leading-relaxed text-brand-700">
              {"// "}
              {t("hero.tagline")}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
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

      {/* Services ticker — decorative marquee (duplicated for seamless loop) */}
      <div aria-hidden="true" className="overflow-hidden border-b border-brand-200 bg-brand-100 py-3">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {serviceKeys.map((key) => (
                <span
                  key={key}
                  className="flex items-center gap-6 pr-6 font-mono text-xs uppercase tracking-[0.25em] text-brand-700"
                >
                  {t(`services.${key}.title`)}
                  <span className="text-brand-500">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Advantages strip */}
      <section aria-labelledby="advantages" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 id="advantages" className="sr-only">
          {t("home.advantages.title")}
        </h2>
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {advantageKeys.map((key, index) => (
            <li key={key} className="border-t border-brand-200 pt-5 transition-colors hover:border-brand-500">
              <span aria-hidden="true" className="font-mono text-sm text-brand-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-sm font-medium uppercase tracking-[0.15em] text-brand-900">
                {t(`home.advantages.items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-brand-700">
                {t(`home.advantages.items.${key}.text`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* What we do — photo cards, grayscale until hover */}
      <section aria-labelledby="what-we-do" className="border-y border-brand-200 bg-brand-100">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Kicker index="01" />
          <h2
            id="what-we-do"
            className="mt-4 font-display text-3xl font-bold uppercase tracking-tight text-brand-900 sm:text-5xl"
          >
            {t("home.whatWeDo.title")}
          </h2>
          <ul className="mt-14 grid gap-px border border-brand-200 bg-brand-200 sm:grid-cols-2 lg:grid-cols-3">
            {serviceKeys.map((key, index) => (
              <li key={key} className="group flex flex-col bg-brand-50">
                <div className="relative overflow-hidden">
                  <img
                    src={images.services[key]}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-3 bg-brand-50/90 px-5 py-3 backdrop-blur">
                    <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-brand-900">
                      {t(`services.${key}.title`)}
                    </h3>
                    <span aria-hidden="true" className="font-mono text-xs text-brand-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>
                <p className="px-5 py-4 text-sm font-light leading-relaxed text-brand-700">
                  {t(`services.${key}.description`)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-14">
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
            className="aspect-[4/5] w-full border border-brand-200 object-cover grayscale transition-all duration-500 hover:grayscale-0 md:aspect-[3/4]"
          />
          <div>
            <Kicker index="02" />
            <h2
              id="who-we-are"
              className="mt-4 font-display text-3xl font-bold uppercase tracking-tight text-brand-900 sm:text-5xl"
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
      <section aria-labelledby="team" className="border-y border-brand-200 bg-brand-100">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Kicker index="03" />
          <h2
            id="team"
            className="mt-4 font-display text-3xl font-bold uppercase tracking-tight text-brand-900 sm:text-5xl"
          >
            {t("home.team.title")}
          </h2>
          <p className="mt-4 max-w-xl font-light leading-relaxed text-brand-700">
            {t("home.team.intro")}
          </p>
          <ul className="mt-14 grid gap-8 sm:grid-cols-3">
            {teamMembers.map((member) => (
              <li key={member.roleKey} className="group">
                <img
                  src={member.image}
                  alt={member.name}
                  loading="lazy"
                  className="aspect-[3/4] w-full border border-brand-200 object-cover grayscale transition-all duration-500 group-hover:border-brand-500 group-hover:grayscale-0"
                />
                <h3 className="mt-5 font-display text-lg font-medium text-brand-900">
                  {member.name}
                </h3>
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-brand-500">
                  {t(`home.team.roles.${member.roleKey}`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials — curated quotes (update with real reviews). */}
      <section aria-labelledby="testimonials" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Kicker index="04" />
        <h2
          id="testimonials"
          className="mt-4 font-display text-3xl font-bold uppercase tracking-tight text-brand-900 sm:text-5xl"
        >
          {t("home.testimonials.title")}
        </h2>
        <ul className="mt-14 grid gap-px border border-brand-200 bg-brand-200 md:grid-cols-3">
          {testimonialKeys.map((key) => (
            <li key={key} className="flex flex-col bg-brand-50 p-8">
              <span aria-hidden="true" className="font-display text-4xl font-bold text-brand-500">
                “
              </span>
              <blockquote className="mt-2 flex-1 text-sm font-light leading-relaxed text-brand-700">
                {t(`home.testimonials.items.${key}.quote`)}
              </blockquote>
              <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-brand-500">
                — {t(`home.testimonials.items.${key}.name`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA band — full-bleed photo with booking call-to-action */}
      <section aria-labelledby="cta-band" className="relative overflow-hidden border-t border-brand-200">
        <img
          src={images.ctaBand}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-brand-50/60" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <p aria-hidden="true" className="font-mono text-xs tracking-[0.3em] text-brand-500">
            [&nbsp;05&nbsp;]
          </p>
          <h2
            id="cta-band"
            className="mt-4 font-display text-3xl font-bold uppercase tracking-tight text-brand-900 sm:text-5xl"
          >
            {t("home.ctaBand.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-light leading-relaxed text-brand-700">
            {t("home.ctaBand.text")}
          </p>
          <Link to="/booking" className={`mt-10 ${solidCta}`}>
            {t("hero.cta")}
          </Link>
        </div>
      </section>
    </>
  );
}
