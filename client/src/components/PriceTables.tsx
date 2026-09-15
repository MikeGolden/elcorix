import { useTranslation } from "react-i18next";
import {
  formatPrice,
  menPackages,
  menPrices,
  packageDeal,
  womenPackages,
  womenPrices,
  type PackageDeal,
  type PackageGroup,
  type PricePackage,
  type ZonePrice,
} from "../pricing";

/**
 * `prices.women.*` / `prices.men.*` / `prices.packages.<group>.*` are
 * guaranteed to exist by the types in pricing.ts; TypeScript cannot
 * correlate the two unions across a template literal, so the casts are
 * confined here.
 */
function zoneLabel(group: PackageGroup, key: string) {
  return `prices.${group}.${key}` as "prices.women.upperLip";
}
function packageLabel(group: PackageGroup, key: string, field: "name" | "zones") {
  return `prices.packages.${group}.${key}.${field}` as "prices.packages.women.smoothDuo.name";
}

/** The single-zone price list of one group. */
function ZoneTable({
  group,
  rows,
}: {
  group: PackageGroup;
  rows: ZonePrice<"women">[] | ZonePrice<"men">[];
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "de";
  return (
    <section aria-labelledby={`prices-${group}`}>
      <h3 id={`prices-${group}`} className="px-4 text-lg font-bold text-brand-700">
        {t(`prices.groups.${group}` as "prices.groups.women")}
      </h3>
      {/* Full page width, but in two columns from `sm` up: a zone name and
          its price 1200px apart read as two unrelated columns, so the list
          fills the width by splitting instead of by stretching a row.
          The zebra stripe therefore has to follow the VISUAL row, not the
          item index — every other pair at two columns, every other item at
          one. Two columns only from `md`: below that the longest zone names
          wrap to a second line. */}
      <ul
        className="mt-4 grid gap-x-8 md:grid-cols-2
          max-md:[&>li:nth-child(2n)]:bg-surface-soft
          md:[&>li:nth-child(4n+3)]:bg-surface-soft
          md:[&>li:nth-child(4n+4)]:bg-surface-soft"
      >
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-baseline justify-between gap-6 rounded-lg px-4 py-3 text-[0.95rem]"
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

/**
 * The three lines that make up one package cell: the total (the loudest
 * thing in the cell), the per-treatment price it works out to, and the
 * saving against booking the same sessions one by one.
 *
 * They deliberately live INSIDE the 6er / 8er column rather than in
 * columns, footnotes or tooltips of their own: the visitor compares two
 * offers, and every figure that belongs to one offer has to sit under it.
 */
function PackageDealCell({
  deal,
  language,
  align,
}: {
  deal: PackageDeal;
  language: string;
  align: "left" | "right";
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex flex-col gap-1 ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span className="whitespace-nowrap text-[1.05rem] font-bold leading-tight text-ink-900">
        {t("prices.packageMeta.total", { price: formatPrice(language, deal.total) })}
      </span>
      <span className="whitespace-nowrap text-xs leading-tight text-ink-500">
        {t("prices.packageMeta.perTreatment", {
          price: formatPrice(language, deal.perTreatment),
        })}
      </span>
      <span className="whitespace-nowrap rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold leading-tight text-brand-700">
        {t("prices.packageMeta.save", {
          percent: deal.advertisedPercent,
          amount: formatPrice(language, deal.saved),
        })}
      </span>
    </div>
  );
}

/**
 * One combined-package table. Women and men use the same component, so the
 * two tables cannot drift apart in structure or in visual logic.
 *
 * Desktop is the five-column table: Angebot | Enthaltene Zonen |
 * Einzelbehandlung | 6er-Paket | 8er-Paket. Below `md` the same rows are
 * cards — five columns, two of them three lines tall, do not survive a
 * phone width, and a horizontally scrolled table hides exactly the two
 * columns the visitor came for.
 */
function PackageTable<G extends PackageGroup>({
  group,
  rows,
}: {
  group: G;
  rows: PricePackage<G>[];
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "de";
  if (rows.length === 0) return null;

  const id = `prices-packages-${group}`;
  const heading =
    group === "women" ? "prices.groups.packagesWomen" : "prices.groups.packagesMen";
  const note = group === "women" ? "prices.packageNotes.women" : "prices.packageNotes.men";
  const columns = ["package", "zones", "single", "six", "eight"] as const;

  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="px-4 text-lg font-bold text-brand-700">
        {t(heading)}
      </h3>

      {/* Desktop: the five-column table. It needs ~860px of its own before
          the zone column starts wrapping to four lines, so it only appears
          at `lg` — at `md` it used to overflow the viewport and scroll the
          whole page sideways. */}
      <div className="mt-4 hidden lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-ink-900">
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={`px-4 py-3 font-semibold ${
                    column === "package" || column === "zones"
                      ? ""
                      : "whitespace-nowrap text-right"
                  }`}
                >
                  {t(`prices.columns.${column}` as "prices.columns.package")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key} className={index % 2 === 1 ? "bg-surface-soft" : ""}>
                <th
                  scope="row"
                  className="whitespace-nowrap rounded-l-lg px-4 py-4 align-top font-semibold text-ink-900"
                >
                  {t(packageLabel(group, row.key, "name"))}
                </th>
                <td className="px-4 py-4 align-top text-ink-500">
                  {t(packageLabel(group, row.key, "zones"))}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right align-top font-semibold text-ink-700">
                  {formatPrice(language, row.single)}
                </td>
                <td className="px-4 py-4 align-top">
                  <PackageDealCell
                    deal={packageDeal(row.single, 6, row.six)}
                    language={language}
                    align="right"
                  />
                </td>
                <td className="rounded-r-lg px-4 py-4 align-top">
                  <PackageDealCell
                    deal={packageDeal(row.single, 8, row.eight)}
                    language={language}
                    align="right"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones and small tablets: the same five fields, stacked per package. */}
      <ul className="mt-4 grid gap-4 lg:hidden">
        {rows.map((row) => (
          <li key={row.key} className="rounded-card border border-line p-4">
            <p className="font-semibold text-ink-900">
              {t(packageLabel(group, row.key, "name"))}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              {t(packageLabel(group, row.key, "zones"))}
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-300">
                  {t("prices.columns.single")}
                </dt>
                <dd className="mt-1 text-[1.05rem] font-bold text-ink-900">
                  {formatPrice(language, row.single)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-300">
                  {t("prices.columns.six")}
                </dt>
                <dd className="mt-1">
                  <PackageDealCell
                    deal={packageDeal(row.single, 6, row.six)}
                    language={language}
                    align="left"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-300">
                  {t("prices.columns.eight")}
                </dt>
                <dd className="mt-1">
                  <PackageDealCell
                    deal={packageDeal(row.single, 8, row.eight)}
                    language={language}
                    align="left"
                  />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <p className="mt-4 px-4 text-xs leading-relaxed text-ink-500">{t(note)}</p>
    </section>
  );
}

/**
 * One gendered price block: the single-zone list first, the combined
 * packages under it — the order Mykhailo chose, so the visitor reads what
 * one zone costs before the package that bundles several.
 */
export function PriceGroup({ group }: { group: PackageGroup }) {
  return (
    <div className="grid gap-10">
      {group === "women" ? (
        <>
          <ZoneTable group="women" rows={womenPrices} />
          <PackageTable group="women" rows={womenPackages} />
        </>
      ) : (
        <>
          <ZoneTable group="men" rows={menPrices} />
          <PackageTable group="men" rows={menPackages} />
        </>
      )}
    </div>
  );
}
