import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import AltegioLink from "./AltegioLink";
import {
  COURSE_SIZES,
  firstVisitOffer,
  formatPercent,
  formatPrice,
  isFromPrice,
  menPackages,
  menPrices,
  packageDeal,
  womenPackages,
  womenPrices,
  type CourseSize,
  type PackageDeal,
  type PackageGroup,
  type PricePackage,
  type ZonePrice,
} from "../pricing";

/**
 * The columns of the price sheet of 2026-10-22: Paket | Zonen pro
 * Behandlung | Einzelbehandlung | 6 | 8 | 10 Behandlungen. (The sheet lists
 * the zones before the name; the name stays first here because it is the
 * row header screen readers announce.)
 */
const COLUMNS = ["package", "zones", "single", "six", "eight", "ten"] as const;
type Column = (typeof COLUMNS)[number];

/** The four that carry a figure, and so are shared between both layouts. */
const PRICE_COLUMNS = ["single", "six", "eight", "ten"] as const;
type PriceColumn = (typeof PRICE_COLUMNS)[number];

const COURSE_COLUMNS = Object.keys(COURSE_SIZES) as CourseSize[];

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

/**
 * The level of a group's headings: h2 directly under the /prices <h1>, h3
 * inside the home page's "Preise" section, which has its own h2. A skipped
 * level breaks the outline screen readers navigate by.
 */
type HeadingLevel = "h2" | "h3";

/** The single-zone price list of one group. */
function ZoneTable({
  group,
  rows,
  headingLevel: Heading,
  bookable = false,
}: {
  group: PackageGroup;
  rows: ZonePrice<"women">[] | ZonePrice<"men">[];
  headingLevel: HeadingLevel;
  /** Show the Altegio link on zones that have one — /prices only; the
      home page's price list keeps the packages teaser as its one link. */
  bookable?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "de";
  return (
    <section aria-labelledby={`prices-${group}`}>
      <Heading id={`prices-${group}`} className="px-4 text-lg font-bold text-brand-700">
        {t(`prices.groups.${group}` as "prices.groups.women")}
      </Heading>
      {/* Full page width, but in two columns from `md` up: a zone name and
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
            <span className="flex items-baseline gap-3 whitespace-nowrap">
              {/* Bartkontur has its own Altegio service, so it is the one
                  zone that can be booked straight from the list. */}
              {bookable && row.key === "beardContour" && (
                <AltegioLink
                  to="beardContour"
                  ariaLabel={t("prices.bookZone.label", { zone: t(zoneLabel(group, row.key)) })}
                  className="text-sm font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-800"
                >
                  {t("prices.bookZone.link")}
                </AltegioLink>
              )}
              <span className="font-semibold text-ink-900">{formatPrice(language, row.price)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** What each zone name covers — the sheet's small print under the list. */
const ZONE_NOTE_LINES = ["line1", "line2", "line3"] as const;

function ZoneNotes({ group }: { group: PackageGroup }) {
  const { t } = useTranslation();
  return (
    <ul data-testid={`zone-notes-${group}`} className="grid gap-1 px-4 text-sm leading-relaxed text-ink-500">
      {ZONE_NOTE_LINES.map((line) => (
        <li key={line}>{t(`prices.zoneNotes.${group}.${line}` as "prices.zoneNotes.women.line1")}</li>
      ))}
    </ul>
  );
}

/**
 * The three lines of one course cell, in the sheet's order: the price per
 * treatment (the loudest thing in the cell), the total that is paid for the
 * course, and the saving against booking the same sessions one by one.
 *
 * They deliberately live INSIDE the course column rather than in columns,
 * footnotes or tooltips of their own: every figure that belongs to one
 * offer has to sit under it.
 */
function PackageDealCell({
  deal,
  from,
  language,
  align,
}: {
  deal: PackageDeal;
  /** Print "ab": the package's combinations do not all cost this. */
  from: boolean;
  language: string;
  align: "left" | "right";
}) {
  const { t } = useTranslation();
  const price = (value: number) => {
    const formatted = formatPrice(language, value);
    return from ? t("prices.packageMeta.from", { price: formatted }) : formatted;
  };
  return (
    <div
      className={`flex flex-col gap-1 ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span className="whitespace-nowrap text-[1.05rem] font-bold leading-tight text-ink-900">
        {t("prices.packageMeta.perTreatment", { price: price(deal.perTreatment) })}
      </span>
      <span className="whitespace-nowrap text-xs leading-tight text-ink-500">
        {t("prices.packageMeta.total", { price: price(deal.total) })}
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
 * subtitle is what keeps the column from reading as a course price.
 */
function SinglePrice({
  price,
  from,
  language,
  align,
}: {
  price: number;
  from: boolean;
  language: string;
  align: "left" | "right";
}) {
  const { t } = useTranslation();
  const formatted = formatPrice(language, price);
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <span className="whitespace-nowrap text-[1.05rem] font-bold leading-tight text-ink-900">
        {from ? t("prices.packageMeta.from", { price: formatted }) : formatted}
      </span>
      <span className="block whitespace-nowrap text-xs leading-tight text-ink-500">
        {t("prices.packageMeta.perSingle")}
      </span>
    </div>
  );
}

/**
 * The zones a package covers, and — where the sheet says so — what it does
 * not cover, as a second line inside the same cell so a visitor reading one
 * row never has to look elsewhere to learn what is missing from it.
 */
function ZoneCell({ group, packageKey }: { group: PackageGroup; packageKey: string }) {
  const { t, i18n } = useTranslation();
  const excludedKey = packageLabel(group, packageKey, "excluded");
  // Only some rows carry the key; `t` is typed over the whole resource, so
  // the leaf type is asserted here like the keys above.
  const excluded: string | null = i18n.exists(excludedKey)
    ? (t(excludedKey) as string)
    : null;
  return (
    <>
      <span className="block">{t(packageLabel(group, packageKey, "zones"))}</span>
      {excluded === null ? null : (
        <span className="mt-1 block text-ink-500">{excluded}</span>
      )}
    </>
  );
}

function ColumnLabel({ column }: { column: Column }) {
  const { t } = useTranslation();
  return <>{t(`prices.columns.${column}` as "prices.columns.package")}</>;
}

/**
 * The four price fields of one package row, built once and placed twice.
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
  const course = (size: CourseSize) => (
    <PackageDealCell
      deal={packageDeal(row.prices.single, COURSE_SIZES[size], row.prices[size])}
      from={isFromPrice(row, size)}
      language={language}
      align={align}
    />
  );
  return {
    single: (
      <SinglePrice
        price={row.prices.single}
        from={isFromPrice(row, "single")}
        language={language}
        align={align}
      />
    ),
    six: course("six"),
    eight: course("eight"),
    ten: course("ten"),
  };
}

/**
 * The box under a table for a package whose zones the client picks: every
 * combination at its own prices, written out the way the sheet writes it
 * ("Achseln + Bikini klassisch: 129 € einzeln; 6 × 122 € = 732 €; …"). Each
 * figure is derived from pricing.ts, so it cannot contradict the "ab" row.
 */
function CombinationBox({
  group,
  row,
}: {
  group: PackageGroup;
  row: PricePackage<"women"> | PricePackage<"men">;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "de";
  if (!row.combinations) return null;
  const id = `prices-combinations-${row.key}`;
  return (
    <section
      aria-labelledby={id}
      data-testid={id}
      className="rounded-card border border-line p-5 text-sm leading-relaxed text-ink-700"
    >
      <h3 id={id} className="font-semibold text-ink-900">
        {t("prices.combinationBox.title", { name: t(packageLabel(group, row.key, "name")) })}
      </h3>
      <p className="mt-2">{t("prices.combinationBox.intro")}</p>
      <ul className="mt-2 grid gap-1">
        {row.combinations.map((combination) => (
          <li key={combination.key}>
            {t("prices.combinationBox.line", {
              zones: t(`prices.combinations.${combination.key}`),
              single: formatPrice(language, combination.prices.single),
              courses: COURSE_COLUMNS.map((size) =>
                t("prices.combinationBox.course", {
                  count: COURSE_SIZES[size],
                  price: formatPrice(language, combination.prices[size]),
                  total: formatPrice(language, combination.prices[size] * COURSE_SIZES[size]),
                }),
              ).join("; "),
            })}
          </li>
        ))}
      </ul>
      <p className="mt-2">{t("prices.combinationBox.outro")}</p>
    </section>
  );
}

/**
 * One combined-package table. Women and men use the same component, so the
 * two tables cannot drift apart in structure or in visual logic.
 *
 * Desktop is the six-column table. Below `xl` the same rows are cards —
 * six columns, four of them three lines tall, do not survive a narrower
 * width, and a horizontally scrolled table hides exactly the columns the
 * visitor came for.
 */
function PackageTable({
  group,
  rows,
  headingLevel: Heading,
}: {
  group: PackageGroup;
  rows: PricePackage<"women">[] | PricePackage<"men">[];
  headingLevel: HeadingLevel;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "de";
  if (rows.length === 0) return null;

  const id = `prices-packages-${group}`;
  const heading =
    group === "women" ? "prices.groups.packagesWomen" : "prices.groups.packagesMen";

  return (
    <section aria-labelledby={id} className="grid gap-4">
      <Heading id={id} className="px-4 text-lg font-bold text-brand-700">
        {t(heading)}
      </Heading>

      {/* Desktop: the six-column table. Its min-content width is ~1050px,
          so it only appears at `xl` — any earlier and it overflows the
          viewport and scrolls the whole page sideways. */}
      <div className="hidden xl:block">
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
                  <ColumnLabel column={column} />
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
                  <td className="px-4 py-4 align-top">{cells.eight}</td>
                  <td className="rounded-r-lg px-4 py-4 align-top">{cells.ten}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phones, tablets and small laptops: the same fields, stacked per package. */}
      <ul className="grid gap-4 xl:hidden">
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
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {PRICE_COLUMNS.map((column) => (
                  <div key={column}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                      <ColumnLabel column={column} />
                    </dt>
                    <dd className="mt-1">{cells[column]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>

      {rows.map((row) =>
        row.combinations ? <CombinationBox key={row.key} group={group} row={row} /> : null,
      )}
    </section>
  );
}

/**
 * The "Ersttermin" card that opens each block: one package's first
 * treatment, consultation included, at an introductory price next to that
 * package's regular single price.
 */
function FirstVisitCard({ group }: { group: PackageGroup }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "de";
  const offer = firstVisitOffer(group);
  const id = `prices-first-visit-${group}`;
  return (
    <section
      aria-labelledby={id}
      data-testid={id}
      className="rounded-card bg-brand-50 p-6 sm:p-8"
    >
      <h2 id={id} className="text-sm font-semibold uppercase tracking-wide text-brand-700">
        {t(`prices.firstVisit.${group}.title` as "prices.firstVisit.women.title")}
      </h2>
      <p className="mt-2 font-semibold text-ink-900">
        {t("prices.firstVisit.offer", {
          zones: t(packageLabel(group, offer.packageKey, "zones")),
          name: t(packageLabel(group, offer.packageKey, "name")),
        })}
      </p>
      <p className="mt-2 text-2xl font-bold text-ink-900">
        {t("prices.firstVisit.price", {
          price: formatPrice(language, offer.price),
          regular: formatPrice(language, offer.regular),
        })}
      </p>
      <p className="mt-2 text-sm text-ink-700">
        {t(`prices.firstVisit.${group}.body` as "prices.firstVisit.women.body")}
      </p>
      <AltegioLink
        to={group === "women" ? "firstVisitWomen" : "firstVisitMen"}
        className="btn-primary mt-5"
      >
        {t("prices.firstVisit.cta")}
      </AltegioLink>
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
 * Only a group's single-zone list — the home page shows these and leaves the
 * package tables to /prices, pointing there with `PackagesTeaser`.
 */
export function ZoneGroup({ group }: { group: PackageGroup }) {
  return <ZoneTable group={group} rows={GROUPS[group].zones} headingLevel="h3" />;
}

/**
 * One gendered price block on /prices: the Ersttermin offer, the
 * single-zone list with its small print, the packages, then a booking
 * button. Zones before packages is the order Mykhailo chose, so the visitor
 * reads what one zone costs before the package that bundles several.
 */
export function PriceGroup({ group }: { group: PackageGroup }) {
  const { t } = useTranslation();
  const { zones, packages } = GROUPS[group];
  return (
    // The id is the target of the jump links at the top of /prices.
    <div id={`prices-group-${group}`} className="grid gap-10">
      <FirstVisitCard group={group} />
      <div className="grid gap-4">
        <ZoneTable group={group} rows={zones} headingLevel="h2" bookable />
        <ZoneNotes group={group} />
      </div>
      <PackageTable group={group} rows={packages} headingLevel="h2" />
      <div className="px-4">
        <AltegioLink to="general" className="btn-ghost">
          {t("cta.bookOnline")}
        </AltegioLink>
      </div>
    </div>
  );
}
