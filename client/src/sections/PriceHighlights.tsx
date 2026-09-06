import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PackagePriceTable, ZonePriceTables } from "../components/PriceTables";

export default function PriceHighlights() {
  const { t } = useTranslation();
  return (
    <section
      id="prices"
      aria-labelledby="prices-title"
      className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20"
    >
      <h2 id="prices-title" className="text-center text-2xl font-bold sm:text-3xl">
        {t("prices.title")}
      </h2>
      <div className="mt-10">
        <ZonePriceTables />
      </div>
      <div className="mt-14">
        <PackagePriceTable />
      </div>
      <div className="mt-10 flex justify-end">
        <Link to="/prices" className="btn-primary">
          {t("cta.fullPriceList")}
        </Link>
      </div>
    </section>
  );
}
