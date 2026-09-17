import LocalizedLink from "../components/LocalizedLink";
import { useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";
import { ZoneGroup } from "../components/PriceTables";
import { ArrowRightIcon } from "../components/icons";
import { maxPackageSavingPercent } from "../pricing";

/**
 * The home page shows the single-zone prices only. The combined packages
 * live on /prices; here they get one teaser that links straight to them.
 */
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
        <ZoneGroup group="women" />
      </Reveal>
      <Reveal className="mt-12">
        <ZoneGroup group="men" />
      </Reveal>
      <Reveal className="mt-12" delay={90}>
        <PackagesTeaser />
      </Reveal>
      <Reveal className="mt-10 flex justify-end" delay={90}>
        <LocalizedLink to="/prices" className="btn-primary">
          {t("cta.fullPriceList")}
        </LocalizedLink>
      </Reveal>
    </section>
  );
}

/** The whole band is the link, so the question and the arrow are one target. */
function PackagesTeaser() {
  const { t } = useTranslation();
  return (
    <LocalizedLink
      to="/prices#prices-packages-women"
      data-testid="packages-teaser"
      className="group flex flex-col gap-3 rounded-2xl bg-brand-50 px-6 py-6 transition-colors
        hover:bg-brand-100 sm:flex-row sm:items-center sm:justify-between sm:px-8"
    >
      <span className="text-xl font-bold text-ink-900 sm:text-2xl">
        {t("prices.packagesTeaser.text", { percent: maxPackageSavingPercent() })}
      </span>
      <span className="inline-flex items-center gap-2 text-[0.95rem] font-semibold text-brand-700">
        {t("prices.packagesTeaser.link")}
        <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </span>
    </LocalizedLink>
  );
}
