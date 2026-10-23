import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import App from "../App";
import { altegioLinks } from "../business";

/**
 * A build with VITE_ENABLE_ALTEGIO=false: no embed, no /booking, no consent
 * banner — and every booking button falls back to a new-tab link into
 * Altegio, which loads nothing on our page.
 */
vi.mock("../config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config")>();
  return { ...actual, features: { ...actual.features, altegio: false } };
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("with the Altegio flag off", () => {
  it("hides the booking block and leaves nothing pointing at it", () => {
    renderAt("/en");
    expect(screen.queryByRole("region", { name: "Book an appointment" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("altegio-consent-placeholder")).not.toBeInTheDocument();
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toMatch(/#booking$|\/booking(\?|$)/);
    }
  });

  it("asks for no cookie consent — nothing needs it", async () => {
    renderAt("/en");
    // The banner opens only after the stored decision has been read (an
    // effect), so give it that tick before asserting it stays away.
    await waitFor(() => expect(screen.getByRole("contentinfo")).toBeInTheDocument());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cookie settings" })).not.toBeInTheDocument();
  });

  it("leaves Altegio and the cookie-consent line out of the privacy policy", async () => {
    renderAt("/en/privacy");
    expect(await screen.findByText(/^i18nextLng, to store the language/)).toBeInTheDocument();
    expect(screen.queryByText(/^cookie-consent, to store your choice/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Altegio Europe KFT/)).not.toBeInTheDocument();
    // No gap where the section was: WhatsApp follows OpenStreetMap directly.
    const titles = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    const osm = titles.findIndex((title) => title.endsWith("OpenStreetMap"));
    expect(titles[osm + 1]).toMatch(/WhatsApp/);
    expect(parseInt(titles[osm + 1]!, 10)).toBe(parseInt(titles[osm]!, 10) + 1);
  });

  it("does not serve /booking", () => {
    renderAt("/en/booking");
    expect(screen.getByRole("heading", { level: 1, name: /page not found/i })).toBeInTheDocument();
  });

  it("turns every booking button into a new-tab link into Altegio", async () => {
    renderAt("/de/preise");
    const women = await screen.findByTestId("prices-first-visit-women");
    const link = within(women).getByRole("link", { name: "Ersttermin buchen" });
    expect(link).toHaveAttribute("href", altegioLinks.firstVisitWomen);
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Bartkontur buchen" })).toHaveAttribute(
      "href",
      altegioLinks.beardContour,
    );
  });
});
