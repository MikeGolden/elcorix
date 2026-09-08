import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";
import { PackagePriceTable, ZonePriceTables } from "../components/PriceTables";

export default function PriceHighlights() {
  const { t } = useTranslation();
  return (
    <section
      id="prices"
      aria-labelledby="prices-title"
      className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20"
    >
      <Reveal as="h2" id="prices-title" className="text-center text-2xl font-bold sm:text-3xl">
        {t("prices.title")}
      </Reveal>
      <Reveal className="mt-10" delay={90}>
        <ZonePriceTables />
      </Reveal>
      {/* Its own reveal — the package table is a screen further down. */}
      <Reveal className="mt-14">
        <PackagePriceTable />
      </Reveal>
      <Reveal className="mt-10 flex justify-end" delay={90}>
        <Link to="/prices" className="btn-primary">
          {t("cta.fullPriceList")}
        </Link>
      </Reveal>
    </section>
  );
}
