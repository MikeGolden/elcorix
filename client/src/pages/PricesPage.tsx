import { Link } from "react-router-dom";
import LocalizedLink from "../components/LocalizedLink";
import { useTranslation } from "react-i18next";
import { PackagePriceTable, ZonePriceTables } from "../components/PriceTables";
import { usePageMeta } from "../seo/usePageMeta";
import { features } from "../config";
import { useAnchorHref } from "../i18n/useLanguage";

export default function PricesPage() {
  const { t } = useTranslation();
  const anchor = useAnchorHref();
  usePageMeta("prices");
  return (
    <section
      aria-labelledby="prices-page-title"
      className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20"
    >
      <h1 id="prices-page-title" className="text-3xl font-extrabold sm:text-4xl">
        {t("prices.pageTitle")}
      </h1>
      <p className="mt-5 max-w-2xl text-[0.95rem] leading-relaxed">{t("prices.intro")}</p>

      <div className="mt-12">
        <ZonePriceTables />
      </div>
      <div className="mt-14">
        <PackagePriceTable />
      </div>

      <p className="mt-12 max-w-2xl text-sm leading-relaxed text-ink-500">
        {t("prices.note")}
      </p>
      {/* /booking only exists while the Altegio flag is on (src/features.ts);
          otherwise the CTA goes to the consultation request on the landing
          page, which needs no third party. */}
      {features.altegio ? (
        <LocalizedLink to="/booking" className="btn-primary mt-8">
          {t("cta.book")}
        </LocalizedLink>
      ) : (
        <Link to={anchor("consultation")} className="btn-primary mt-8">
          {t("cta.consultation")}
        </Link>
      )}
    </section>
  );
}
