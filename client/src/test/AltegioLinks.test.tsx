import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "../App";
import { altegioLinks } from "../business";
import { firstVisitOffer, menPrices } from "../pricing";

/** Pinned on: a local .env must not decide which behaviour is tested. */
vi.mock("../config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config")>();
  return { ...actual, features: { ...actual.features, altegio: true } };
});

const SERVICES = "https://n1463826.alteg.io/company/1390972/personal/select-services";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function grantBookingConsent() {
  window.localStorage.setItem(
    "cookie-consent",
    JSON.stringify({ version: 1, decidedAt: new Date().toISOString(), booking: true }),
  );
}

describe("the Altegio booking links", () => {
  it("are the studio's start page and its three services", () => {
    // select-services, not the select-master links the studio sent: those
    // bounce to the start page and hang (business.ts).
    expect(altegioLinks).toEqual({
      general: "https://n1463826.alteg.io",
      firstVisitWomen: `${SERVICES}?o=s13920267`,
      firstVisitMen: `${SERVICES}?o=s13920268`,
      beardContour: `${SERVICES}?o=s13859238`,
    });
  });

  it("sit next to the prices the services cost in Altegio", () => {
    // Altegio: Smooth Duo – Ersttermin 129 €, Clear Back – Ersttermin 159 €,
    // Bartkontur 59 €. If a price on the site moves, the service has to move too.
    expect(firstVisitOffer("women")).toMatchObject({ packageKey: "smoothDuo", price: 129 });
    expect(firstVisitOffer("men")).toMatchObject({ packageKey: "clearBack", price: 159 });
    expect(menPrices.find((zone) => zone.key === "beardContour")?.price).toBe(59);
  });
});

describe("the booking buttons", () => {
  it("open the on-site calendar on each first-visit service", async () => {
    renderAt("/de/preise");
    const women = await screen.findByTestId("prices-first-visit-women");
    const men = screen.getByTestId("prices-first-visit-men");
    expect(within(women).getByRole("link", { name: "Ersttermin buchen" })).toHaveAttribute(
      "href",
      "/de/termin-vereinbaren?service=firstVisitWomen",
    );
    expect(within(men).getByRole("link", { name: "Ersttermin buchen" })).toHaveAttribute(
      "href",
      "/de/termin-vereinbaren?service=firstVisitMen",
    );
  });

  it("book the beard contour from its row, and no other zone", async () => {
    renderAt("/de/preise");
    const link = await screen.findByRole("link", { name: "Bartkontur buchen" });
    expect(link).toHaveAttribute("href", "/de/termin-vereinbaren?service=beardContour");
    expect(link.closest("li")).toHaveTextContent("Bartkontur");
    expect(document.querySelectorAll('[data-booking="beardContour"]')).toHaveLength(1);
  });

  it("send every generic 'Termin buchen' on /prices to the calendar's start page", async () => {
    renderAt("/de/preise");
    await screen.findByTestId("prices-first-visit-women");
    const generic = screen
      .getAllByRole("link", { name: "Termin buchen" })
      .filter((link) => link.closest("main"));
    // One under each block, one under the course terms.
    expect(generic).toHaveLength(3);
    for (const link of generic) expect(link).toHaveAttribute("href", "/de/termin-vereinbaren");
  });

  it("sit beside the consultation button in the hero and the header", async () => {
    renderAt("/en");
    const hero = (await screen.findByRole("heading", { level: 1 })).closest("section")!;
    expect(within(hero).getByRole("link", { name: "Book an appointment" })).toHaveAttribute(
      "href",
      "/en/booking",
    );
    expect(
      within(hero).getByRole("link", { name: "Get a consultation" }).getAttribute("href"),
    ).toMatch(/#consultation$/);
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("link", { name: "Book an appointment" })).toHaveAttribute(
      "href",
      "/en/booking",
    );
    expect(within(header).getByRole("link", { name: "Get a consultation" })).toBeInTheDocument();
  });

  it("land on the calendar with the right service loaded", async () => {
    grantBookingConsent();
    const user = userEvent.setup();
    renderAt("/de/preise");
    const men = await screen.findByTestId("prices-first-visit-men");
    await user.click(within(men).getByRole("link", { name: "Ersttermin buchen" }));
    expect(await screen.findByTestId("altegio-widget")).toHaveAttribute(
      "src",
      altegioLinks.firstVisitMen,
    );
  });
});
