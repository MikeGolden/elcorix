import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { priceList, type PriceCategoryKey } from "../pricing";
import { usePageMeta } from "../seo/usePageMeta";

/**
 * pricing.ts guarantees at compile time that every category/item pair has
 * a translation; TypeScript cannot correlate the two unions across the
 * template literal, so narrow the key type here in one place.
 */
function priceItemKey(category: PriceCategoryKey, item: string) {
  return `prices.items.${category}.${item}` as `prices.items.facial.basic`;
}

function formatPrice(language: string, price: number): string {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function PricesPage() {
  const { t, i18n } = useTranslation();
  usePageMeta("prices");
  const language = i18n.resolvedLanguage ?? "de";

  return (
    <section aria-labelledby="prices" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div aria-hidden="true" className="h-px w-12 bg-brand-500" />
      <h1
        id="prices"
        className="mt-6 font-display text-3xl font-bold uppercase tracking-tight text-brand-900 sm:text-5xl"
      >
        {t("prices.title")}
      </h1>
      <p className="mt-5 max-w-2xl font-light leading-loose text-brand-700">
        {t("prices.intro")}
      </p>

      <div className="mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2">
        {priceList.map((category) => (
          <section key={category.key} aria-labelledby={`prices-${category.key}`}>
            <h2
              id={`prices-${category.key}`}
              className="border-b border-brand-200 pb-3 text-sm font-medium uppercase tracking-[0.15em] text-brand-900"
            >
              {t(`services.${category.key}.title`)}
            </h2>
            <ul className="mt-4 space-y-3">
              {category.items.map((item) => (
                <li key={item.key} className="flex items-baseline justify-between gap-4">
                  <span className="font-light text-brand-700">
                    {t(priceItemKey(category.key, item.key))}
                  </span>
                  <span className="whitespace-nowrap font-mono text-sm text-brand-500">
                    {item.from
                      ? t("prices.from", { price: formatPrice(language, item.price) })
                      : formatPrice(language, item.price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-14 max-w-2xl text-sm font-light leading-relaxed text-brand-700">
        {t("prices.note")}
      </p>
      <Link
        to="/booking"
        className="mt-8 inline-block bg-brand-500 px-10 py-4 text-xs font-medium uppercase tracking-[0.22em] text-brand-50 transition-colors hover:bg-brand-600"
      >
        {t("hero.cta")}
      </Link>
    </section>
  );
}
