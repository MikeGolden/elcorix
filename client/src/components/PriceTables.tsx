import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  formatPercent,
  formatPrice,
  formatPriceExact,
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
 * The sheet's five columns, in its order: Paket | Enthaltene Zonen |
 * Einzelbehandlung | 6 Behandlungen | 8 Behandlungen.
 */
const COLUMNS = ["package", "zones", "single", "six", "eight"] as const;
type Column = (typeof COLUMNS)[number];

/** The three that carry a figure, and so are shared between both layouts. */
const PRICE_COLUMNS = ["single", "six", "eight"] as const;
type PriceColumn = (typeof PRICE_COLUMNS)[number];

/**
 * `prices.women.*` / `prices.men.*` / `prices.packages.<group>.*` are
 * guaranteed to exist by the types in pricing.ts; TypeScript cannot
 * correlate the two unions across a template literal, so the casts are
 * confined here.
 */
function zoneLabel(group: PackageGroup, key: string) {
  return `prices.${group}.${key}` as "prices.women.upperLip";
}
function packageLabel(
  group: PackageGroup,
  key: string,
  field: "name" | "zones" | "excluded",
) {
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
          price: formatPriceExact(language, deal.perTreatment),
        })}
      </span>
      <span className="whitespace-nowrap rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold leading-tight text-brand-700">
        {t("prices.packageMeta.save", {
          amount: formatPrice(language, deal.saved),
          percent: formatPercent(language, deal.savedPercent),
        })}
      </span>
    </div>
  );
}

/**
 * The single-treatment price, with the sheet's own subtitle under it. The
 * subtitle is what keeps the column from reading as a package price: every
 * other number in the row is a total for six or eight sessions.
 */
function SinglePrice({
  price,
  language,
  align,
}: {
  price: number;
  language: string;
  align: "left" | "right";
}) {
  const { t } = useTranslation();
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <span className="whitespace-nowrap text-[1.05rem] font-bold leading-tight text-ink-900">
        {formatPrice(language, price)}
      </span>
      <span className="block whitespace-nowrap text-xs leading-tight text-ink-500">
        {t("prices.packageMeta.perSingle")}
      </span>
    </div>
  );
}

/**
 * The zones a package covers, and — on the two Body Complete rows — what it
 * does not cover. The sheet of 2026-09-14 puts the exclusion inside the cell
 * rather than in a footnote under the table, so a visitor reading one row
 * never has to look elsewhere to learn what is missing from it.
 */
function ZoneCell({ group, packageKey }: { group: PackageGroup; packageKey: string }) {
  const { t, i18n } = useTranslation();
  const excludedKey = packageLabel(group, packageKey, "excluded");
  // Only the two Body Complete rows carry the key; `t` is typed over the
  // whole resource, so the leaf type is asserted here like the keys above.
  const excluded: string | null = i18n.exists(excludedKey)
    ? (t(excludedKey) as string)
    : null;
  return (
    <>
      <span className="block">{t(packageLabel(group, packageKey, "zones"))}</span>
      {excluded === null ? null : (
        <span className="mt-1 block text-ink-300">{excluded}</span>
      )}
    </>
  );
}

/**
 * A column's name, with the sheet's badge under it on the two package
 * columns. The table head and the cards' term list both render it, so the
 * badge can never end up on one layout and not the other.
 */
function ColumnLabel({ column, badgeClassName }: { column: Column; badgeClassName: string }) {
  const { t } = useTranslation();
  return (
    <>
      {t(`prices.columns.${column}` as "prices.columns.package")}
      {column === "six" || column === "eight" ? (
        <span className={`block ${badgeClassName}`}>
          {t(`prices.columnBadges.${column}` as "prices.columnBadges.six")}
        </span>
      ) : null}
    </>
  );
}

/**
 * The three price fields of one package row, built once and placed twice.
 *
 * The arithmetic that turns a row into a deal lives here and nowhere else:
 * the desktop table and the phone cards print the same package, so they must
 * not each work out what it saves. `align` is all they disagree about.
 */
function priceCells(
  row: PricePackage<"women"> | PricePackage<"men">,
  language: string,
  align: "left" | "right",
): Record<PriceColumn, ReactNode> {
  return {
    single: <SinglePrice price={row.single} language={language} align={align} />,
    six: (
      <PackageDealCell
        deal={packageDeal(row.single, 6, row.six)}
        language={language}
        align={align}
      />
    ),
    eight: (
      <PackageDealCell
        deal={packageDeal(row.single, 8, row.eight)}
        language={language}
        align={align}
      />
    ),
  };
}

/**
 * One combined-package table. Women and men use the same component, so the
 * two tables cannot drift apart in structure or in visual logic.
 *
 * Desktop is the five-column table: Paket | Enthaltene Zonen |
 * Einzelbehandlung | 6 Behandlungen | 8 Behandlungen — the sheet's own
 * columns, in its order. Below `lg` the same rows are
 * cards — five columns, two of them three lines tall, do not survive a
 * phone width, and a horizontally scrolled table hides exactly the two
 * columns the visitor came for.
 */
function PackageTable({
  group,
  rows,
}: {
  group: PackageGroup;
  rows: PricePackage<"women">[] | PricePackage<"men">[];
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "de";
  if (rows.length === 0) return null;

  const id = `prices-packages-${group}`;
  const heading =
    group === "women" ? "prices.groups.packagesWomen" : "prices.groups.packagesMen";

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
              {COLUMNS.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={`px-4 py-3 font-semibold ${
                    column === "package" || column === "zones"
                      ? ""
                      : "whitespace-nowrap text-right"
                  }`}
                >
                  <ColumnLabel
                    column={column}
                    badgeClassName="text-[0.7rem] font-semibold uppercase tracking-wide text-brand-700"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const cells = priceCells(row, language, "right");
              return (
                <tr key={row.key} className={index % 2 === 1 ? "bg-surface-soft" : ""}>
                  <th
                    scope="row"
                    className="whitespace-nowrap rounded-l-lg px-4 py-4 align-top font-semibold text-ink-900"
                  >
                    {t(packageLabel(group, row.key, "name"))}
                  </th>
                  <td className="px-4 py-4 align-top text-ink-500">
                    <ZoneCell group={group} packageKey={row.key} />
                  </td>
                  <td className="px-4 py-4 text-right align-top">{cells.single}</td>
                  <td className="px-4 py-4 align-top">{cells.six}</td>
                  <td className="rounded-r-lg px-4 py-4 align-top">{cells.eight}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phones and small tablets: the same five fields, stacked per package. */}
      <ul className="mt-4 grid gap-4 lg:hidden">
        {rows.map((row) => {
          const cells = priceCells(row, language, "left");
          return (
            <li key={row.key} className="rounded-card border border-line p-4">
              <p className="font-semibold text-ink-900">
                {t(packageLabel(group, row.key, "name"))}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                <ZoneCell group={group} packageKey={row.key} />
              </p>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                {PRICE_COLUMNS.map((column) => (
                  <div key={column}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-300">
                      <ColumnLabel column={column} badgeClassName="text-brand-700" />
                    </dt>
                    <dd className="mt-1">{cells[column]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The two price lists a group is made of, paired here rather than at the
 * call site: this is the one place that says the women's zones go with the
 * women's packages.
 *
 * The `satisfies` is what makes that a rule rather than a convention — the
 * mapped type instantiates per key, so hanging `menPackages` under `women`
 * is a compile error, and a new group without both of its lists is too.
 */
const GROUPS = {
  women: { zones: womenPrices, packages: womenPackages },
  men: { zones: menPrices, packages: menPackages },
} as const satisfies {
  [G in PackageGroup]: { zones: ZonePrice<G>[]; packages: PricePackage<G>[] };
};

/**
 * One gendered price block: the single-zone list first, the combined
 * packages under it — the order Mykhailo chose, so the visitor reads what
 * one zone costs before the package that bundles several.
 */
export function PriceGroup({ group }: { group: PackageGroup }) {
  const { zones, packages } = GROUPS[group];
  return (
    <div className="grid gap-10">
      <ZoneTable group={group} rows={zones} />
      <PackageTable group={group} rows={packages} />
    </div>
  );
}
