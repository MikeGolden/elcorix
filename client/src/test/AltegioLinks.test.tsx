import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import App from "../App";
import { altegioLinks } from "../business";
import { firstVisitOffer, menPrices } from "../pricing";

const SELECT = "https://n1463826.alteg.io/company/1390972/personal/select-master";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

/** Every Altegio link opens a new tab without handing Altegio our window. */
function expectExternal(link: HTMLElement, href: string) {
  expect(link).toHaveAttribute("href", href);
  expect(link).toHaveAttribute("target", "_blank");
  expect(link.getAttribute("rel")).toContain("noopener");
}

describe("the Altegio booking links", () => {
  it("are the four links the studio sent, character for character", () => {
    expect(altegioLinks).toEqual({
      general: "https://n1463826.alteg.io",
      firstVisitWomen: `${SELECT}?o=s13920267`,
      firstVisitMen: `${SELECT}?o=s13920268`,
      beardContour: `${SELECT}?o=s13859238`,
    });
  });

  it("sit next to the prices the studio booked them at", () => {
    // The Altegio services are 129 € / 159 € / 59 €. If a price on the site
    // moves, the service in Altegio has to move with it.
    expect(firstVisitOffer("women")).toMatchObject({ packageKey: "smoothDuo", price: 129 });
    expect(firstVisitOffer("men")).toMatchObject({ packageKey: "clearBack", price: 159 });
    expect(menPrices.find((zone) => zone.key === "beardContour")?.price).toBe(59);
  });

  it("book each first visit from its own card", async () => {
    renderAt("/de/preise");
    const women = await screen.findByTestId("prices-first-visit-women");
    const men = screen.getByTestId("prices-first-visit-men");
    expectExternal(within(women).getByRole("link", { name: "Ersttermin buchen" }), altegioLinks.firstVisitWomen);
    expectExternal(within(men).getByRole("link", { name: "Ersttermin buchen" }), altegioLinks.firstVisitMen);
  });

  it("book the beard contour from its row, and no other zone", async () => {
    renderAt("/de/preise");
    const link = await screen.findByRole("link", { name: "Bartkontur buchen" });
    expectExternal(link, altegioLinks.beardContour);
    expect(link.closest("li")).toHaveTextContent("Bartkontur");
    expect(document.querySelectorAll('[data-altegio="beardContour"]')).toHaveLength(1);
  });

  it("leave the home page's price list without a beard contour link", async () => {
    renderAt("/de");
    await screen.findByRole("heading", { level: 1 });
    expect(document.querySelectorAll('[data-altegio="beardContour"]')).toHaveLength(0);
  });

  it("send every generic 'Termin buchen' on /prices to the booking start page", async () => {
    renderAt("/de/preise");
    await screen.findByTestId("prices-first-visit-women");
    const generic = screen
      .getAllByRole("link", { name: "Termin buchen" })
      .filter((link) => link.closest("main"));
    // One under each block, one under the course terms.
    expect(generic).toHaveLength(3);
    for (const link of generic) expectExternal(link, altegioLinks.general);
  });

  it("put the booking button beside the consultation one in the hero and the header", async () => {
    renderAt("/en");
    const hero = await screen.findByRole("heading", { level: 1 });
    const section = hero.closest("section")!;
    expectExternal(within(section).getByRole("link", { name: "Book an appointment" }), altegioLinks.general);
    expect(
      within(section).getByRole("link", { name: "Get a consultation" }).getAttribute("href"),
    ).toMatch(/#consultation$/);
    const header = screen.getByRole("banner");
    expectExternal(within(header).getByRole("link", { name: "Book an appointment" }), altegioLinks.general);
    expect(within(header).getByRole("link", { name: "Get a consultation" })).toBeInTheDocument();
  });
});
