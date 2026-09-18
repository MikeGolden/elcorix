import LocalizedLink from "../components/LocalizedLink";
import { useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";
import { ZoneGroup } from "../components/PriceTables";
import { ArrowRightIcon } from "../components/icons";

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
    </section>
  );
}

/** The whole band is the one link to the package tables. */
function PackagesTeaser() {
  const { t } = useTranslation();
  return (
    <LocalizedLink
      to="/prices#prices-packages-women"
      data-testid="packages-teaser"
      className="group flex items-center justify-between gap-4 rounded-2xl bg-brand-900 px-6 py-6
        transition-colors hover:bg-brand-800 sm:px-8"
    >
      <span className="text-xl font-bold text-white sm:text-2xl">
        {t("prices.packagesTeaser")}
      </span>
      <ArrowRightIcon className="h-6 w-6 shrink-0 text-white transition-transform group-hover:translate-x-1" />
    </LocalizedLink>
  );
}
