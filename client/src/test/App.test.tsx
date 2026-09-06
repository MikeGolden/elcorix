import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { navAnchors } from "../content";
import en from "../i18n/locales/en/common.json";

/** Resolve a dotted translation key against the English resource. */
function label(key: string): string {
  return key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en) as string;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  it("renders every landing section of the Figma layout on the home page", () => {
    renderAt("/");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /permanent laser hair removal in kempten/i,
      }),
    ).toBeInTheDocument();
    for (const name of [
      /who is it for\?/i,
      /modern diode laser technology/i,
      /your skin in experienced hands/i,
      /take a look at our work/i,
      /popular services and prices/i,
      /book an appointment/i,
      /request a free consultation/i,
      /contact & appointments/i,
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });

  it("opens the anchor menu and links every section", async () => {
    renderAt("/");
    const user = userEvent.setup();
    // The menu is collapsed until the hamburger is pressed.
    expect(screen.queryByRole("navigation", { name: "Menu" })).not.toBeInTheDocument();

    await user.click(screen.getByTestId("menu-toggle"));
    const nav = screen.getByRole("navigation", { name: "Menu" });
    for (const anchor of navAnchors) {
      expect(within(nav).getByRole("link", { name: label(anchor.key) })).toHaveAttribute(
        "href",
        `/#${anchor.id}`,
      );
    }
  });

  it("points the anchor menu back at the home page from a deep route", async () => {
    renderAt("/prices");
    const user = userEvent.setup();
    await user.click(screen.getByTestId("menu-toggle"));
    const nav = screen.getByRole("navigation", { name: "Menu" });
    expect(within(nav).getByRole("link", { name: /our price list/i })).toHaveAttribute(
      "href",
      "/#prices",
    );
  });

  it("renders the Altegio widget on the booking page once booking cookies are accepted", () => {
    window.localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ version: 1, decidedAt: new Date().toISOString(), booking: true }),
    );
    renderAt("/booking");
    expect(
      screen.getByRole("heading", { level: 1, name: /book an appointment/i }),
    ).toBeInTheDocument();
    const iframe = screen.getByTestId("altegio-widget");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", expect.stringContaining("alteg.io"));
  });

  it("gates the Altegio widget behind consent", () => {
    window.localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ version: 1, decidedAt: new Date().toISOString(), booking: false }),
    );
    renderAt("/booking");
    expect(screen.getByTestId("altegio-consent-placeholder")).toBeInTheDocument();
    expect(screen.queryByTestId("altegio-widget")).not.toBeInTheDocument();
  });

  it("links the four legal pages from the footer", () => {
    renderAt("/");
    const footer = screen.getByRole("navigation", { name: "Legal" });
    expect(within(footer).getByRole("link", { name: "Imprint" })).toHaveAttribute(
      "href",
      "/imprint",
    );
    expect(within(footer).getByRole("link", { name: "Privacy policy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(within(footer).getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(within(footer).getByRole("link", { name: "Mission" })).toHaveAttribute(
      "href",
      "/mission",
    );
  });

  it("renders the price tables from the Figma on /prices", () => {
    renderAt("/prices");
    expect(
      screen.getByRole("heading", { level: 1, name: /price list/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /services for women/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /services for men/i })).toBeInTheDocument();
    // "Upper lip" is both a zone and the name of the first package.
    expect(screen.getAllByText("Upper lip").length).toBeGreaterThan(0);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
