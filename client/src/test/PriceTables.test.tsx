import type { ReactElement } from "react";
import { render as rtlRender, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import i18n from "../i18n";
import { PriceGroup, ZoneGroup } from "../components/PriceTables";
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
} from "../pricing";

/**
 * ELCORIX_Laser_Preise_Fuer_Website (sheet "Для_сайта", 2026-10-22),
 * transcribed cell for cell: per package the single price, then per course
 * size the price per treatment and the total the sheet prints next to it.
 *
 * The app stores only the per-treatment price; the total is derived. This
 * table is what proves the derivation reproduces the sheet. A price edit
 * that no longer matches the sheet fails here.
 */
type SheetCell = { per: number; total: number };
type SheetRow = { single: number } & Record<CourseSize, SheetCell>;
const row = (
  single: number,
  [p6, t6]: [number, number],
  [p8, t8]: [number, number],
  [p10, t10]: [number, number],
): SheetRow => ({
  single,
  six: { per: p6, total: t6 },
  eight: { per: p8, total: t8 },
  ten: { per: p10, total: t10 },
});

const SHEET: Record<string, SheetRow> = {
  smoothDuoLight: row(129, [122, 732], [116, 928], [110, 1100]),
  smoothDuo: row(139, [132, 792], [126, 1008], [120, 1200]),
  smoothLegs: row(179, [169, 1014], [159, 1272], [150, 1500]),
  smoothTrioLight: row(199, [185, 1110], [175, 1400], [165, 1650]),
  smoothTrio: row(229, [215, 1290], [205, 1640], [195, 1950]),
  smoothComplete: row(299, [285, 1710], [270, 2160], [255, 2550]),
  clearBack: row(179, [169, 1014], [159, 1272], [149, 1490]),
  strongTorso: row(149, [139, 834], [129, 1032], [120, 1200]),
  businessBody: row(249, [235, 1410], [225, 1800], [210, 2100]),
  neckShoulders: row(109, [103, 618], [97, 776], [90, 900]),
  coolClean: row(149, [139, 834], [129, 1032], [120, 1200]),
  menSmoothDuo: row(139, [132, 792], [126, 1008], [120, 1200]),
};

/** "Einzelzonen", Damen and Herren, as the sheet names and prices them. */
const SHEET_ZONES_WOMEN: [string, number][] = [
  ["Oberlippe", 39], ["Kinn", 39], ["Wangen", 49], ["Gesicht", 79], ["Hals", 49],
  ["Nacken", 39], ["Achseln", 69], ["Bikinizone klassisch", 69], ["Intim Basic", 79],
  ["Intim Complete", 99], ["Pofalte", 39], ["Gesäß", 69], ["Gesäß komplett", 89],
  ["Unterarme", 69], ["Oberarme", 69], ["Arme komplett inkl. Hände/Finger", 109],
  ["Hände/Finger", 29], ["Bauch", 59], ["Bauchlinie", 29], ["Rücken komplett", 89],
  ["Unterschenkel inkl. Knie", 99], ["Oberschenkel", 119],
  ["Beine komplett inkl. Füße/Zehen", 179], ["Füße/Zehen", 29],
];
const SHEET_ZONES_MEN: [string, number][] = [
  ["Bartkontur", 59], ["Hals", 49], ["Nacken", 49], ["Achseln", 59], ["Schultern", 69],
  ["Brust", 89], ["Bauch", 79], ["Rücken komplett", 119], ["Intim Complete inkl. Pofalte", 99],
  ["Pofalte", 49], ["Gesäß", 89], ["Arme komplett inkl. Hände/Finger", 129],
  ["Unterschenkel inkl. Knie", 119], ["Oberschenkel", 129],
  ["Beine komplett inkl. Füße/Zehen", 199],
];

/** The booking buttons are router links, so every render needs a router. */
const render = (ui: ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

const ROWS = [...womenPackages, ...menPackages];
const SIZES = Object.keys(COURSE_SIZES) as CourseSize[];

/** Intl puts a (narrow) no-break space before € and inside "1 100"; compare as plain spaces. */
const plain = (text: string | null) => (text ?? "").replace(/[  ]/g, " ");

describe("the package prices", () => {
  it("are the twelve rows of the sheet, at the sheet's prices", () => {
    expect(ROWS.map((r) => r.key)).toEqual(Object.keys(SHEET));
    for (const r of ROWS) {
      const sheet = SHEET[r.key];
      expect(r.prices.single, r.key).toBe(sheet.single);
      for (const size of SIZES) {
        const deal = packageDeal(r.prices.single, COURSE_SIZES[size], r.prices[size]);
        expect(deal.perTreatment, `${r.key} ${size}`).toBe(sheet[size].per);
        expect(deal.total, `${r.key} ${size}`).toBe(sheet[size].total);
      }
    }
  });

  it("get cheaper per treatment the longer the course", () => {
    for (const r of [...ROWS, ...ROWS.flatMap((p) => p.combinations ?? [])]) {
      const { single, six, eight, ten } = r.prices;
      expect(single).toBeGreaterThan(six);
      expect(six).toBeGreaterThan(eight);
      expect(eight).toBeGreaterThanOrEqual(ten);
    }
  });
});

describe("the single zones", () => {
  it.each([
    ["women", womenPrices, SHEET_ZONES_WOMEN],
    ["men", menPrices, SHEET_ZONES_MEN],
  ] as const)("are the sheet's %s list, names and prices, in its order", async (group, zones, sheet) => {
    await i18n.changeLanguage("de");
    expect(zones.map((z) => [i18n.t(`prices.${group}.${z.key}` as "prices.women.upperLip"), z.price])).toEqual(
      sheet,
    );
  });
});

describe("Smooth Duo Light", () => {
  const duoLight = womenPackages.find((p) => p.key === "smoothDuoLight")!;

  it("is listed at its cheapest combination", () => {
    for (const column of ["single", ...SIZES] as const) {
      const cheapest = Math.min(...duoLight.combinations!.map((c) => c.prices[column]));
      expect(duoLight.prices[column], column).toBe(cheapest);
    }
  });

  it("says 'ab' exactly where its combinations differ", () => {
    expect(isFromPrice(duoLight, "single")).toBe(true);
    expect(isFromPrice(duoLight, "six")).toBe(true);
    expect(isFromPrice(duoLight, "eight")).toBe(true);
    // Both combinations cost 110 € in the 10er course.
    expect(isFromPrice(duoLight, "ten")).toBe(false);
    for (const other of ROWS.filter((p) => p !== duoLight)) {
      expect(isFromPrice(other, "single")).toBe(false);
    }
  });
});

describe("packageDeal", () => {
  it("never claims a saving the prices do not support", () => {
    for (const r of ROWS) {
      for (const size of SIZES) {
        const sessions = COURSE_SIZES[size];
        const deal = packageDeal(r.prices.single, sessions, r.prices[size]);
        expect(deal.saved).toBe(r.prices.single * sessions - deal.total);
        expect(deal.saved).toBeGreaterThan(0);
        expect(deal.savedPercent).toBeCloseTo((deal.saved / (r.prices.single * sessions)) * 100, 10);
      }
    }
  });

  it("puts the best saving under 20 %, which the home teaser no longer advertises", () => {
    const best = Math.max(
      ...ROWS.flatMap((r) =>
        SIZES.map((size) => packageDeal(r.prices.single, COURSE_SIZES[size], r.prices[size]).savedPercent),
      ),
    );
    expect(formatPercent("de", best)).toBe("19,5");
  });
});

describe("the first-visit offers", () => {
  it("compare the sheet's introductory price with the package's regular single price", () => {
    expect(firstVisitOffer("women")).toEqual({ packageKey: "smoothDuo", price: 129, regular: 139 });
    expect(firstVisitOffer("men")).toEqual({ packageKey: "clearBack", price: 159, regular: 179 });
  });
});

describe("the euro sign", () => {
  /**
   * Ukrainian CLDR has no default symbol for the euro: without
   * `currencyDisplay: "narrowSymbol"` every Ukrainian price renders
   * "1 239 EUR" while the other three languages render "1.239 €".
   */
  it.each(["de", "en", "uk", "ru"])("is a sign, not a code, in %s", (language) => {
    for (const price of [29, 1100, 2550]) {
      expect(formatPrice(language, price)).toContain("€");
      expect(formatPrice(language, price)).not.toContain("EUR");
    }
  });
});

describe("PriceGroup", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("opens with the first-visit offer, then zones, then packages", () => {
    render(<PriceGroup group="men" />);
    const headings = screen.getAllByRole("heading").map((node) => node.textContent);
    expect(headings).toEqual([
      "Men · First appointment",
      "Services for men",
      "Combined packages for men",
    ]);
  });

  it("keeps the home page's zone list at h3, under its own h2", () => {
    render(<ZoneGroup group="women" />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Services for women");
  });

  it("gives both tables the sheet's six columns, without badges", () => {
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
        "Zones per treatment",
        "Single treatment",
        "6 treatments",
        "8 treatments",
        "10 treatments",
      ]);
    }
  });

  it("prints the sheet's German cells: per treatment, total, and the saving under them", async () => {
    await i18n.changeLanguage("de");
    render(<PriceGroup group="women" />);
    const tableRow = within(screen.getByRole("table")).getAllByRole("row")[2];
    expect(within(tableRow).getByRole("rowheader")).toHaveTextContent("Smooth Duo");
    const cells = within(tableRow).getAllByRole("cell");
    // zones + single + three course columns — the saving has no column of its own.
    expect(cells).toHaveLength(5);
    expect(cells[0]).toHaveTextContent("Achseln + Intim komplett inkl. Bikinizone und Pofalte");
    expect(plain(cells[1].textContent)).toBe("139 €pro Behandlung");
    expect(plain(cells[2].textContent)).toBe("132 € / Behandlung792 € gesamtSie sparen 42 € · 5,0 %");
    expect(plain(cells[3].textContent)).toBe("126 € / Behandlung1.008 € gesamtSie sparen 104 € · 9,4 %");
    expect(plain(cells[4].textContent)).toBe("120 € / Behandlung1.200 € gesamtSie sparen 190 € · 13,7 %");
  });

  it("prints Smooth Duo Light with 'ab' where the combinations differ", async () => {
    await i18n.changeLanguage("de");
    render(<PriceGroup group="women" />);
    const tableRow = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(within(tableRow).getByRole("rowheader")).toHaveTextContent("Smooth Duo Light");
    const cells = within(tableRow).getAllByRole("cell");
    expect(plain(cells[1].textContent)).toBe("ab 129 €pro Behandlung");
    expect(plain(cells[2].textContent)).toMatch(/^ab 122 € \/ Behandlungab 732 € gesamt/);
    expect(plain(cells[3].textContent)).toMatch(/^ab 116 € \/ Behandlungab 928 € gesamt/);
    expect(plain(cells[4].textContent)).toMatch(/^110 € \/ Behandlung1.100 € gesamt/);
  });

  it("writes out every Smooth Duo Light combination the way the sheet does", async () => {
    await i18n.changeLanguage("de");
    render(<PriceGroup group="women" />);
    const box = screen.getByTestId("prices-combinations-smoothDuoLight");
    expect(within(box).getByRole("heading")).toHaveTextContent(
      "Smooth Duo Light · Welche Kombination passt?",
    );
    const lines = within(box).getAllByRole("listitem").map((li) => plain(li.textContent));
    expect(lines).toEqual([
      "Achseln + Bikini klassisch: 129 € einzeln; 6 × 122 € = 732 €; 8 × 116 € = 928 €; 10 × 110 € = 1.100 €.",
      "Unterschenkel inkl. Knie + Achseln ODER Unterschenkel inkl. Knie + Bikini klassisch: 149 € einzeln; 6 × 135 € = 810 €; 8 × 122 € = 976 €; 10 × 110 € = 1.100 €.",
    ]);
  });

  it("names what a men's package leaves out inside its own row", async () => {
    await i18n.changeLanguage("de");
    render(<PriceGroup group="men" />);
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    const businessBody = rows[3];
    expect(within(businessBody).getByRole("rowheader")).toHaveTextContent("Business Body");
    expect(within(businessBody).getAllByRole("cell")[0].textContent).toBe(
      "Brust + Bauch + Rücken komplettohne Schultern und Nacken",
    );
    const clearBack = rows[1];
    expect(within(clearBack).getAllByRole("cell")[0].textContent).toBe(
      "Rücken komplett + Schultern + Nacken",
    );
  });

  it("shows the Ersttermin card with the sheet's wording", async () => {
    await i18n.changeLanguage("de");
    render(<PriceGroup group="men" />);
    const card = screen.getByTestId("prices-first-visit-men");
    expect(plain(card.textContent)).toBe(
      "Herren · Ersttermin" +
        "Rücken komplett + Schultern + Nacken · Clear Back" +
        "Ersttermin 159 € · regulär 179 €" +
        "Beratung inklusive. Für Neukunden. Ohne Verpflichtung, einen Kurs zu kaufen." +
        "Ersttermin buchen",
    );
  });

  it("prints the zone small print under the zone list", async () => {
    await i18n.changeLanguage("de");
    render(<PriceGroup group="women" />);
    expect(screen.getByTestId("zone-notes-women")).toHaveTextContent(
      "Bikini klassisch: nur seitlich außerhalb der normalen Sliplinie.",
    );
  });
});
