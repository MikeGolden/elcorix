import { Trans, useTranslation } from "react-i18next";
import BookingLink from "../components/BookingLink";
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

        <div className="mt-12 grid gap-16">
          <PriceGroup group="women" />
          <PriceGroup group="men" />
        </div>

        {/* The price sheet of 2026-10-22 puts these course rules under the
            tables itself; validity, breaks and extensions stay in the
            Paketbedingungen, which the last line links to. */}
        <section aria-labelledby="prices-good-to-know" className="mt-16 max-w-3xl">
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

        <BookingLink className="btn-primary mt-8">{t("prices.bookCta")}</BookingLink>
      </section>
      <Faq page="prices" />
    </>
  );
}
