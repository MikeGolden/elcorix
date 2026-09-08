import { Trans, useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";
import { images } from "../images";

const strong = { b: <strong className="font-semibold text-ink-900" /> };

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
      <Reveal className="grid items-center gap-10 rounded-panel bg-surface-soft px-6 py-12 sm:px-10 sm:py-14 md:grid-cols-2 md:gap-14">
        <div>
          <h2 id="specialist-title" className="text-2xl font-bold sm:text-[1.9rem] sm:leading-tight">
            {t("specialist.title")}
          </h2>
          <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed">
            <p>
              <Trans i18nKey="specialist.p1" components={strong} />
            </p>
            <p>
              <Trans i18nKey="specialist.p2" components={strong} />
            </p>
            <p>
              <Trans i18nKey="specialist.p3" components={strong} />
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <img
            src={images.certificate}
            alt={t("specialist.certificateAlt")}
            loading="lazy"
            className="h-full w-full rounded-panel object-contain"
          />
          <img
            src={images.specialist}
            alt={t("specialist.imageAlt")}
            loading="lazy"
            className="h-full min-h-64 w-full rounded-panel object-cover"
          />
        </div>
      </Reveal>
    </section>
  );
}
