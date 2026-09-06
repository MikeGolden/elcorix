import { useTranslation } from "react-i18next";
import {
  formatPrice,
  menPrices,
  packages,
  womenPrices,
  type ZonePrice,
} from "../pricing";

/**
 * `prices.women.*` / `prices.men.*` / `prices.packages.*` are guaranteed
 * to exist by the types in pricing.ts; TypeScript cannot correlate the
 * two unions across a template literal, so the cast is confined here.
 */
function zoneLabel(group: "women" | "men", key: string) {
  return `prices.${group}.${key}` as "prices.women.upperLip";
}
function packageLabel(key: string, field: "name" | "zones") {
  return `prices.packages.${key}.${field}` as "prices.packages.p1.name";
}

function ZoneTable({
  group,
  rows,
}: {
  group: "women" | "men";
  rows: ZonePrice<"women">[] | ZonePrice<"men">[];
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "de";
  return (
    <section aria-labelledby={`prices-${group}`}>
      <h3 id={`prices-${group}`} className="text-lg font-bold text-brand-700">
        {t(`prices.groups.${group}` as "prices.groups.women")}
      </h3>
      <ul className="mt-4">
        {rows.map((row, index) => (
          <li
            key={row.key}
            className={`flex items-baseline justify-between gap-6 rounded-lg px-4 py-3 text-[0.95rem] ${
              index % 2 === 1 ? "bg-surface-soft" : ""
            }`}
          >
            <span className="text-ink-700">{t(zoneLabel(group, row.key))}</span>
            <span className="whitespace-nowrap font-semibold text-ink-900">
              {formatPrice(language, row.price)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The two zone price lists side by side, as in the Figma. */
export function ZonePriceTables() {
  return (
    <div className="grid gap-x-16 gap-y-10 md:grid-cols-2">
      <ZoneTable group="women" rows={womenPrices} />
      <ZoneTable group="men" rows={menPrices} />
    </div>
  );
}

/** "Paketlösungen für Frauen" — scrolls horizontally on small screens. */
export function PackagePriceTable() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "de";
  return (
    <section aria-labelledby="prices-packages">
      <h3 id="prices-packages" className="text-lg font-bold text-brand-700">
        {t("prices.groups.packages")}
      </h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <thead>
            <tr className="text-ink-900">
              <th scope="col" className="px-4 py-3 font-semibold">
                {t("prices.columns.package")}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                {t("prices.columns.zones")}
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-right font-semibold"
              >
                {t("prices.columns.single")}
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-right font-semibold"
              >
                {t("prices.columns.six")}
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-right font-semibold"
              >
                {t("prices.columns.eight")}
              </th>
            </tr>
          </thead>
          <tbody>
            {packages.map((row, index) => (
              <tr key={row.key} className={index % 2 === 1 ? "bg-surface-soft" : ""}>
                <th scope="row" className="rounded-l-lg px-4 py-4 font-medium text-ink-700">
                  {t(packageLabel(row.key, "name"))}
                </th>
                <td className="px-4 py-4 text-ink-500">
                  {t(packageLabel(row.key, "zones"))}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-ink-900">
                  {formatPrice(language, row.single)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-ink-900">
                  {formatPrice(language, row.six)}
                </td>
                <td className="whitespace-nowrap rounded-r-lg px-4 py-4 text-right font-semibold text-ink-900">
                  {formatPrice(language, row.eight)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
