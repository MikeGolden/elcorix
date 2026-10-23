import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import AltegioLink from "../components/AltegioLink";
import LocalizedLink from "../components/LocalizedLink";
import { PriceGroup } from "../components/PriceTables";
import { usePageMeta } from "../seo/usePageMeta";
import Faq from "../sections/Faq";

/** The sheet's "Gut zu wissen" lines, in its order. */
const GOOD_TO_KNOW = [
  "vat",
  "course",
  "payment",
  "switch",
  "switchTerms",
  "sessions",
  "discounts",
] as const;

/**
 * The jump links under the title, in page order. Without them the men's
 * prices only show up after scrolling past the whole women's block.
 * Router links rather than bare `#id` hrefs: ScrollToTop does the smooth
 * scroll and fires again on a repeat click, and the prerendered href still
 * works before hydration.
 */
const PRICE_JUMPS = [
  { id: "prices-group-women", key: "women" },
  { id: "prices-group-men", key: "men" },
  { id: "prices-course-terms", key: "courseTerms" },
] as const;

export default function PricesPage() {
  const { t } = useTranslation();
  usePageMeta("prices");
  return (
    <>
      <section
        aria-labelledby="prices-page-title"
        className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20"
      >
        <h1 id="prices-page-title" className="text-3xl font-extrabold sm:text-4xl">
          {t("prices.pageTitle")}
        </h1>
        <p className="mt-5 max-w-2xl text-[0.95rem] leading-relaxed">{t("prices.intro")}</p>

        <nav aria-label={t("prices.jump.label")} className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {PRICE_JUMPS.map(({ id, key }) => (
              <li key={id}>
                <Link
                  to={{ hash: id }}
                  className="inline-flex rounded-full border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
                >
                  {t(`prices.jump.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12 grid gap-16">
          <PriceGroup group="women" />
          <PriceGroup group="men" />
        </div>

        {/* The price sheet of 2026-10-22 puts these course rules under the
            tables itself; validity, breaks and extensions stay in the
            Paketbedingungen, which the last line links to. */}
        <section
          id="prices-course-terms"
          aria-labelledby="prices-good-to-know"
          className="mt-16 max-w-3xl"
        >
          <h2 id="prices-good-to-know" className="text-lg font-bold text-brand-700">
            {t("prices.goodToKnow.title")}
          </h2>
          <ul className="mt-4 grid list-disc gap-2 pl-5 text-[0.95rem] leading-relaxed text-ink-700">
            {GOOD_TO_KNOW.map((item) => (
              <li key={item}>{t(`prices.goodToKnow.items.${item}`)}</li>
            ))}
            <li>
              <Trans
                i18nKey="prices.goodToKnow.items.details"
                components={{
                  termsLink: (
                    <LocalizedLink
                      to="/package-terms"
                      className="font-medium text-brand-600 underline underline-offset-2"
                    />
                  ),
                }}
              />
            </li>
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-ink-500">{t("prices.note")}</p>
        </section>

        <AltegioLink to="general" className="btn-primary mt-8">
          {t("cta.bookOnline")}
        </AltegioLink>
      </section>
      <Faq page="prices" />
    </>
  );
}
