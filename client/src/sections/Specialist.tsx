import { Trans, useTranslation } from "react-i18next";
import { images } from "../images";
import { credentials } from "../content";
import { CheckIcon } from "../components/icons";

const strong = { b: <strong className="font-semibold text-ink-900" /> };

export default function Specialist() {
  const { t } = useTranslation();
  return (
    <section id="specialist" aria-labelledby="specialist-title" className="px-4 sm:px-6">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 rounded-panel bg-surface-soft px-6 py-12 sm:px-10 sm:py-14 md:grid-cols-2 md:gap-14">
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
          {/* The Figma shows a scan of the training certificate here. Until
              the real document is available this card states the same
              credentials as text — no fabricated document. */}
          <div className="rounded-panel border border-line bg-white p-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-brand-600">
              {t("specialist.credentialsTitle")}
            </h3>
            <ul className="mt-5 space-y-4">
              {credentials.map((key) => (
                <li key={key} className="flex gap-3 text-sm leading-relaxed">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <span>
                    {t(`specialist.credentials.${key}` as "specialist.credentials.training")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <img
            src={images.specialist}
            alt={t("specialist.imageAlt")}
            loading="lazy"
            className="h-full min-h-64 w-full rounded-panel object-cover"
          />
        </div>
      </div>
    </section>
  );
}
