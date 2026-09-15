import { render, screen, within } from "@testing-library/react";
import i18n from "../i18n";
import { PriceGroup } from "../components/PriceTables";
import {
  TIER_DISCOUNT,
  formatPrice,
  menPackages,
  packageDeal,
  womenPackages,
} from "../pricing";

/**
 * The studio's printed price sheet, as Mykhailo supplied it: for every
 * package, the per-treatment price and the saving it advertises. Nothing in
 * the app stores these — they are derived from `single` and the package
 * price — so this table is what proves the derivation reproduces the sheet.
 */
const SHEET: Record<string, { six: [number, number]; eight: [number, number] }> = {
  smoothDuo: { six: [103, 155], eight: [95, 273] },
  smoothLegs: { six: [135, 205], eight: [125, 353] },
  smoothTrio: { six: [166, 255], eight: [155, 433] },
  smoothComplete: { six: [200, 295], eight: [185, 513] },
  bodyCompleteWoman: { six: [255, 385], eight: [236, 663] },
  clearBack: { six: [95, 145], eight: [89, 243] },
  strongTorso: { six: [112, 165], eight: [102, 293] },
  coolClean: { six: [126, 195], eight: [117, 333] },
  intimClean: { six: [80, 115], eight: [74, 203] },
  businessBody: { six: [175, 265], eight: [162, 453] },
  bodyCompleteMan: { six: [280, 415], eight: [259, 723] },
};

describe("packageDeal", () => {
  it("reproduces every line of the studio's price sheet", () => {
    const rows = [...womenPackages, ...menPackages];
    expect(rows).toHaveLength(11);
    for (const row of rows) {
      const expected = SHEET[row.key];
      expect(expected, row.key).toBeDefined();
      const six = packageDeal(row.single, 6, row.six);
      expect([six.perTreatment, six.saved], `${row.key} 6er`).toEqual(expected.six);
      const eight = packageDeal(row.single, 8, row.eight);
      expect([eight.perTreatment, eight.saved], `${row.key} 8er`).toEqual(expected.eight);
    }
  });

  it("prints the tier discount, and no row drifts more than a point from it", () => {
    for (const row of [...womenPackages, ...menPackages]) {
      for (const [sessions, total] of [
        [6, row.six],
        [8, row.eight],
      ] as const) {
        const deal = packageDeal(row.single, sessions, total);
        expect(deal.advertisedPercent, row.key).toBe(TIER_DISCOUNT[sessions]);
        // The guard: a price edit that pulls a row away from its advertised
        // tier has to be noticed, not silently printed. Intim Clean's 6er is
        // the widest gap today at 0,64 points (19,4 % against 20 %).
        const exact = ((row.single * sessions - total) / (row.single * sessions)) * 100;
        expect(
          Math.abs(exact - TIER_DISCOUNT[sessions]),
          `${row.key} ${sessions}er advertises ${TIER_DISCOUNT[sessions]} % but saves ${exact.toFixed(1)} %`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  it("never claims a saving the prices do not support", () => {
    for (const row of [...womenPackages, ...menPackages]) {
      for (const [sessions, total] of [
        [6, row.six],
        [8, row.eight],
      ] as const) {
        const deal = packageDeal(row.single, sessions, total);
        expect(deal.saved).toBe(row.single * sessions - total);
        expect(deal.saved).toBeGreaterThan(0);
        expect(deal.perTreatment).toBeLessThan(row.single);
      }
    }
  });
});

describe("PriceGroup", () => {
  it("puts the single zones first and the packages under them", () => {
    render(<PriceGroup group="men" />);
    const headings = screen.getAllByRole("heading").map((node) => node.textContent);
    expect(headings).toEqual(["Services for men", "Combined packages for men"]);
  });

  it("gives both tables the same five columns", () => {
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
        "Offer",
        "Zones included",
        "Single treatment",
        "6-session package",
        "8-session package",
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

    const [first] = womenPackages;
    expect(within(row).getByRole("rowheader")).toHaveTextContent("Smooth Duo");
    expect(cells[0]).toHaveTextContent("Underarms + intimate complete incl. buttock crease");
    expect(cells[1]).toHaveTextContent(formatPrice("en", first.single));

    const six = cells[2].textContent ?? "";
    expect(six).toContain(formatPrice("en", 619));
    expect(six).toContain(formatPrice("en", 103));
    expect(six).toContain("20%");
    expect(six).toContain(formatPrice("en", 155));

    const eight = cells[3].textContent ?? "";
    expect(eight).toContain(formatPrice("en", 759));
    expect(eight).toContain(formatPrice("en", 95));
    expect(eight).toContain("26%");
    expect(eight).toContain(formatPrice("en", 273));
  });

  it("renders the German wording of the derived lines and the footnote", async () => {
    await i18n.changeLanguage("de");
    render(<PriceGroup group="men" />);
    const row = within(screen.getByRole("table")).getAllByRole("row")[6];
    expect(within(row).getByRole("rowheader")).toHaveTextContent("Body Complete Man*");
    const six = within(row).getAllByRole("cell")[2];
    // \s, not a literal space: Intl puts a non-breaking space before €.
    expect(six.textContent).toMatch(/1\.679\s€ gesamt/);
    expect(six.textContent).toMatch(/ca\.\s280\s€ pro Behandlung/);
    expect(six.textContent).toMatch(/Sie sparen 20\s% \(415\s€\)/);
    expect(
      screen.getByText(/Gesicht, Bartbereich, Hals und Nacken sind nicht enthalten/),
    ).toBeInTheDocument();
  });
});
