import { Trans, useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";
import Photo from "../components/Photo";
import { images } from "../images";

const strong = { b: <strong className="font-semibold text-ink-900" /> };

const paragraphs = ["p1", "p2", "p3", "p4"] as const;

/** The four stages of a visit, in order — keys under `specialist.visit.steps`. */
export const visitSteps = ["consultation", "testPulse", "treatment", "aftercare"] as const;

export default function Specialist() {
  const { t } = useTranslation();
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
          {/* Replaces the placeholder certificate image: states only what
              happens at every appointment, so nothing on it needs verifying. */}
          <div
            aria-labelledby="visit-title"
            role="group"
            className="flex flex-col justify-center rounded-panel bg-white p-6 shadow-[0_1px_3px_rgba(20,32,63,0.06)]"
          >
            <h3 id="visit-title" className="font-display text-lg font-bold leading-snug text-brand-700">
              {t("specialist.visit.title")}
            </h3>
            <ol className="mt-5 space-y-5">
              {visitSteps.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {t(`specialist.visit.steps.${step}.title`)}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-ink-500">
                      {t(`specialist.visit.steps.${step}.text`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Photo
            src={images.specialist}
            alt={t("specialist.imageAlt")}
            width="620"
            height="1240"
            loading="lazy"
            decoding="async"
            className="h-full min-h-64 w-full rounded-panel object-cover sm:max-xl:aspect-[3/4] sm:max-xl:h-auto sm:max-xl:object-top"
          />
        </div>
      </Reveal>
    </section>
  );
}
