import { render, screen, within } from "@testing-library/react";
import i18n from "../i18n";
import { PriceGroup } from "../components/PriceTables";
import {
  formatPercent,
  formatPrice,
  formatPriceExact,
  maxPackageSavingPercent,
  menPackages,
  packageDeal,
  womenPackages,
} from "../pricing";

/**
 * ELCORIX_Laser_Pakete_Website_Developer_Handover_2026-09-14.xlsx, sheet
 * `01_Pakete_kompakt`, transcribed cell for cell: for each package the
 * single price, then per package size the total, the per-treatment price,
 * the euros saved and the percentage the sheet prints.
 *
 * Nothing in the app stores the last three — they are derived from `single`
 * and the package total — so this table is what proves the derivation
 * reproduces the studio's own document, to the cent and to the tenth of a
 * point. A price edit that no longer matches the sheet fails here.
 */
type SheetCell = { total: number; per: number; saved: number; percent: number };
const SHEET: Record<string, { single: number; six: SheetCell; eight: SheetCell }> = {
  smoothDuo: {
    single: 129,
    six: { total: 619, per: 103.17, saved: 155, percent: 20.0 },
    eight: { total: 759, per: 94.88, saved: 273, percent: 26.5 },
  },
  smoothLegs: {
    single: 169,
    six: { total: 809, per: 134.83, saved: 205, percent: 20.2 },
    eight: { total: 999, per: 124.88, saved: 353, percent: 26.1 },
  },
  smoothTrio: {
    single: 209,
    six: { total: 999, per: 166.5, saved: 255, percent: 20.3 },
    eight: { total: 1239, per: 154.88, saved: 433, percent: 25.9 },
  },
  smoothComplete: {
    single: 249,
    six: { total: 1199, per: 199.83, saved: 295, percent: 19.7 },
    eight: { total: 1479, per: 184.88, saved: 513, percent: 25.8 },
  },
  bodyCompleteWoman: {
    single: 319,
    six: { total: 1529, per: 254.83, saved: 385, percent: 20.1 },
    eight: { total: 1889, per: 236.13, saved: 663, percent: 26.0 },
  },
  clearBack: {
    single: 119,
    six: { total: 569, per: 94.83, saved: 145, percent: 20.3 },
    eight: { total: 709, per: 88.63, saved: 243, percent: 25.5 },
  },
  strongTorso: {
    single: 139,
    six: { total: 669, per: 111.5, saved: 165, percent: 19.8 },
    eight: { total: 819, per: 102.38, saved: 293, percent: 26.3 },
  },
  coolClean: {
    single: 159,
    six: { total: 759, per: 126.5, saved: 195, percent: 20.4 },
    eight: { total: 939, per: 117.38, saved: 333, percent: 26.2 },
  },
  intimClean: {
    single: 99,
    six: { total: 479, per: 79.83, saved: 115, percent: 19.4 },
    eight: { total: 589, per: 73.63, saved: 203, percent: 25.6 },
  },
  businessBody: {
    single: 219,
    six: { total: 1049, per: 174.83, saved: 265, percent: 20.2 },
    eight: { total: 1299, per: 162.38, saved: 453, percent: 25.9 },
  },
  bodyCompleteMan: {
    single: 349,
    six: { total: 1679, per: 279.83, saved: 415, percent: 19.8 },
    eight: { total: 2069, per: 258.63, saved: 723, percent: 25.9 },
  },
};

const ROWS = [...womenPackages, ...menPackages];

/** Every package, each with its 6er and 8er line from the sheet. */
const LINES = ROWS.flatMap((row) =>
  ([6, 8] as const).map((sessions) => ({
    key: row.key,
    sessions,
    single: row.single,
    total: sessions === 6 ? row.six : row.eight,
    sheet: sessions === 6 ? SHEET[row.key]?.six : SHEET[row.key]?.eight,
  })),
);

describe("the package prices", () => {
  it("are the eleven rows of the sheet, at the sheet's prices", () => {
    expect(ROWS).toHaveLength(11);
    expect(Object.keys(SHEET)).toHaveLength(11);
    for (const row of ROWS) {
      const sheet = SHEET[row.key];
      expect(sheet, row.key).toBeDefined();
      expect([row.single, row.six, row.eight], row.key).toEqual([
        sheet.single,
        sheet.six.total,
        sheet.eight.total,
      ]);
    }
  });
});

describe("packageDeal", () => {
  it("reproduces every derived figure the sheet prints", () => {
    for (const line of LINES) {
      const deal = packageDeal(line.single, line.sessions, line.total);
      const label = `${line.key} ${line.sessions}er`;
      expect(deal.total, label).toBe(line.sheet.total);
      expect(deal.saved, label).toBe(line.sheet.saved);
      // The sheet rounds both of these for display; comparing the formatted
      // string is what proves the site prints the same characters it does.
      expect(formatPriceExact("de", deal.perTreatment), label).toBe(
        formatPriceExact("de", line.sheet.per),
      );
      expect(formatPercent("de", deal.savedPercent), label).toBe(
        formatPercent("de", line.sheet.percent),
      );
    }
  });

  it("never claims a saving the prices do not support", () => {
    for (const line of LINES) {
      const deal = packageDeal(line.single, line.sessions, line.total);
      expect(deal.saved).toBe(line.single * line.sessions - line.total);
      expect(deal.saved).toBeGreaterThan(0);
      expect(deal.perTreatment).toBeLessThan(line.single);
      // Every row's pill states that row's own arithmetic — there is no
      // advertised tier any more, so no row can drift away from one.
      expect(deal.savedPercent).toBeCloseTo((deal.saved / (line.single * line.sessions)) * 100, 10);
    }
  });
});

describe("the euro sign", () => {
  /**
   * Ukrainian CLDR has no default symbol for the euro: without
   * `currencyDisplay: "narrowSymbol"` every Ukrainian price renders
   * "1 239 EUR" while the other three languages render "1.239 €". This is
   * the test that stops that regressing quietly — it is invisible unless you
   * read the Ukrainian pages.
   */
  it.each(["de", "en", "uk", "ru"])("is a sign, not a code, in %s", (language) => {
    for (const price of [39, 1239, 2069]) {
      expect(formatPrice(language, price)).toContain("€");
      expect(formatPrice(language, price)).not.toContain("EUR");
    }
    expect(formatPriceExact(language, 103.166666)).toContain("€");
    expect(formatPriceExact(language, 103.166666)).not.toContain("EUR");
  });
});

describe("PriceGroup", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("puts the single zones first and the packages under them", () => {
    render(<PriceGroup group="men" />);
    const headings = screen.getAllByRole("heading").map((node) => node.textContent);
    expect(headings).toEqual(["Services for men", "Combined packages for men"]);
  });

  it("gives both tables the sheet's five columns, with its two badges", () => {
    render(
      <>
        <PriceGroup group="women" />
        <PriceGroup group="men" />
      </>,
    );
    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(2);
    for (const table of tables) {
      const headers = within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent);
      expect(headers).toEqual([
        "Package",
        "Zones included",
        "Single treatment",
        "6 treatmentsPopular choice",
        "8 treatmentsBest saving",
      ]);
    }
  });

  it("keeps the per-treatment price and the saving inside the package column", () => {
    render(<PriceGroup group="women" />);
    const row = within(screen.getByRole("table")).getAllByRole("row")[1];
    // rowheader + 4 cells: single, 6-session, 8-session — no extra columns
    // were added for the derived figures.
    const cells = within(row).getAllByRole("cell");
    expect(cells).toHaveLength(4);

    expect(within(row).getByRole("rowheader")).toHaveTextContent("Smooth Duo");
    expect(cells[0]).toHaveTextContent("Underarms + intimate complete incl. buttock crease");
    expect(cells[1]).toHaveTextContent(formatPrice("en", 129));
    expect(cells[1]).toHaveTextContent("per treatment");

    const six = cells[2].textContent ?? "";
    expect(six).toContain(formatPrice("en", 619));
    expect(six).toContain(formatPriceExact("en", 103.17));
    expect(six).toContain(formatPrice("en", 155));
    expect(six).toContain("20.0%");

    const eight = cells[3].textContent ?? "";
    expect(eight).toContain(formatPrice("en", 759));
    expect(eight).toContain(formatPriceExact("en", 94.88));
    expect(eight).toContain(formatPrice("en", 273));
    expect(eight).toContain("26.5%");
  });

  it("prints the German wording of the sheet's derived lines", async () => {
    await i18n.changeLanguage("de");
    render(<PriceGroup group="men" />);
    const row = within(screen.getByRole("table")).getAllByRole("row")[6];
    expect(within(row).getByRole("rowheader")).toHaveTextContent("Body Complete Man");
    const six = within(row).getAllByRole("cell")[2];
    // \s, not a literal space: Intl puts a non-breaking space before €.
    expect(six.textContent).toMatch(/1\.679\s€ gesamt/);
    expect(six.textContent).toMatch(/279,83\s€ \/ Behandlung/);
    expect(six.textContent).toMatch(/Sie sparen 415\s€ · 19,8\s%/);
  });

  it("names the exclusions inside the row, not in a footnote", async () => {
    await i18n.changeLanguage("de");
    render(<PriceGroup group="men" />);
    const table = screen.getByRole("table");
    const row = within(table).getAllByRole("row")[6];
    expect(within(row).getByRole("rowheader")).toHaveTextContent("Body Complete Man");
    expect(within(row).getAllByRole("cell")[0]).toHaveTextContent(
      "Nicht enthalten: Gesicht, Bartbereich, Hals, Nacken",
    );
    // The asterisk and the footnote it pointed at are both gone.
    expect(table.textContent).not.toContain("*");
    expect(screen.queryByText(/sind nicht enthalten/)).not.toBeInTheDocument();
  });

  it("carries no exclusion line on a package that has none", async () => {
    await i18n.changeLanguage("de");
    render(<PriceGroup group="men" />);
    const row = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(within(row).getByRole("rowheader")).toHaveTextContent("Clear Back");
    expect(within(row).getAllByRole("cell")[0].textContent).toBe("Rücken komplett");
  });
});

describe("maxPackageSavingPercent", () => {
  it("is the sheet's best saving rounded down, never up", () => {
    const best = Math.max(
      ...Object.values(SHEET).flatMap((row) => [row.six.percent, row.eight.percent]),
    );
    // Smooth Duo's 8er at 26,5 % in the sheet (26,45 % exact) — the teaser
    // may say "up to 26 %", never "up to 27 %".
    expect(best).toBe(26.5);
    expect(maxPackageSavingPercent()).toBe(26);
  });
});
