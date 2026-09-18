import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LocalizedLink from "../components/LocalizedLink";
import Photo from "../components/Photo";
import { ArrowRightIcon, ChevronLeftIcon, WhatsAppIcon } from "../components/icons";
import { business } from "../config";
import { reasons, situations, type Situation } from "../content";
import type { ReasonKey } from "../images";
import { useAnchorHref } from "../i18n/useLanguage";
import { forWhomRoutes } from "../seo/routes";
import { usePageMeta } from "../seo/usePageMeta";

/** The situations that have a card — and so a page — of their own. */
function hasOwnPage(situation: Situation): situation is Exclude<ReasonKey, "convenience"> {
  return situation in forWhomRoutes;
}

/**
 * The page behind one "Für wen ist es geeignet?" card.
 *
 * `convenience` — "Wann Laser-Haarentfernung das Leben wirklich erleichtert"
 * — is the overview article: intro, all six situations, closing line. The
 * three other cards each open the one situation they name. Every variant
 * ends with the consultation CTA and links to the other cards, so none of
 * these pages is a dead end.
 */
export default function ForWhomPage({ reason }: { reason: ReasonKey }) {
  const { t } = useTranslation();
  const anchor = useAnchorHref();
  usePageMeta(forWhomRoutes[reason].metaKey);

  const isOverview = reason === "convenience";
  const title = isOverview
    ? t("forWhom.items.convenience.title")
    : t(`forWhom.situations.${reason}.title`);
  const lead = isOverview ? t("forWhom.article.intro") : t(`forWhom.situations.${reason}.body`);
  const image = reasons.find((entry) => entry.key === reason)!.image;
  const others = reasons.filter((entry) => entry.key !== reason);

  return (
    <article
      aria-labelledby="for-whom-page-title"
      className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-14"
    >
      <Link to={anchor("for-whom")} className="link-more">
        <ChevronLeftIcon className="h-4 w-4" />
        {t("forWhom.title")}
      </Link>

      <header className="mt-6 grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
        <div className="max-w-3xl">
          <h1
            id="for-whom-page-title"
            className="text-3xl font-extrabold leading-tight tracking-[-0.01em] sm:text-4xl"
          >
            {title}
          </h1>
          <p className="mt-6 text-[1.05rem] leading-relaxed">{lead}</p>
        </div>
        <Photo
          src={image}
          alt=""
          width="480"
          height="480"
          decoding="async"
          className="h-48 w-48 rounded-panel object-cover sm:h-64 sm:w-64 lg:h-72 lg:w-72"
        />
      </header>

      {isOverview && (
        <ol className="mt-12 grid gap-5 md:grid-cols-2">
          {situations.map((situation) => (
            <li key={situation} className="flex flex-col rounded-panel bg-surface-soft p-6 sm:p-7">
              <h2 className="text-[1.1rem] font-bold leading-snug text-ink-900">
                {t(`forWhom.situations.${situation}.title`)}
              </h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed">
                {t(`forWhom.situations.${situation}.body`)}
              </p>
              {hasOwnPage(situation) && (
                <LocalizedLink
                  to={forWhomRoutes[situation].path}
                  className="link-more mt-auto pt-4"
                  aria-label={`${t("cta.learnMore")}: ${t(`forWhom.situations.${situation}.title`)}`}
                >
                  {t("cta.learnMore")}
                  <ArrowRightIcon />
                </LocalizedLink>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-12 flex flex-col gap-6 rounded-panel bg-brand-50 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-2xl text-[1.05rem] font-semibold leading-relaxed text-ink-900">
          {t("forWhom.article.outro")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to={anchor("consultation")} className="btn-primary">
            {t("cta.consultation")}
          </Link>
          <a href={business.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            <WhatsAppIcon />
            {t("cta.whatsapp")}
          </a>
        </div>
      </div>

      <section aria-labelledby="for-whom-others" className="mt-14">
        <h2 id="for-whom-others" className="text-2xl font-bold">
          {t("forWhom.others")}
        </h2>
        <ul className="mt-6 grid gap-5 md:grid-cols-3">
          {others.map((other) => (
            <li key={other.key}>
              <LocalizedLink
                to={forWhomRoutes[other.key].path}
                className="group flex h-full items-center gap-4 rounded-panel bg-surface-soft p-4 transition-colors hover:bg-brand-50"
              >
                <Photo
                  src={other.image}
                  alt=""
                  width="480"
                  height="480"
                  loading="lazy"
                  decoding="async"
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                />
                <span>
                  <span className="block text-[0.95rem] font-bold leading-snug text-ink-900">
                    {t(`forWhom.items.${other.key}.title`)}
                  </span>
                  <span className="link-more mt-2 group-hover:text-brand-600">
                    {t("cta.learnMore")}
                    <ArrowRightIcon />
                  </span>
                </span>
              </LocalizedLink>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
