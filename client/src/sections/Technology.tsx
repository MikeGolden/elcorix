import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";
import Photo from "../components/Photo";
import { images } from "../images";
import { useAnchorHref } from "../i18n/useLanguage";

/** The lead-in of each paragraph is bold in the Figma. */
const strong = { b: <strong className="font-semibold text-ink-900" /> };

export default function Technology() {
  const { t } = useTranslation();
  const anchor = useAnchorHref();
  return (
    <section
      id="technology"
      aria-labelledby="technology-title"
      className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        {/* The reveal sits on a wrapper rather than on the <img> itself:
            <Photo> renders a <picture>, and `as="img"` cannot carry one. */}
        <Reveal>
          <Photo
            src={images.technology}
            alt={t("technology.imageAlt")}
            width="1200"
            height="900"
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full rounded-panel object-cover"
          />
        </Reveal>
        <Reveal delay={110}>
          <h2 id="technology-title" className="text-2xl font-bold sm:text-[1.9rem] sm:leading-tight">
            {t("technology.title")}
          </h2>
          <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed">
            <p>
              <Trans i18nKey="technology.p1" components={strong} />
            </p>
            <p>
              <Trans i18nKey="technology.p2" components={strong} />
            </p>
            <p>
              <Trans i18nKey="technology.p3" components={strong} />
            </p>
          </div>
          <Link to={anchor("consultation")} className="btn-primary mt-8">
            {t("cta.moreDevices")}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
