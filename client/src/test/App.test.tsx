import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import App from "../App";
import BookingPage from "../pages/BookingPage";
import { ConsentProvider } from "../consent/ConsentContext";
import { navAnchors } from "../content";
import en from "../i18n/locales/en/common.json";

/** Resolve a dotted translation key against the English resource. */
function label(key: string): string {
  return key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en) as string;
}

/** Reports the URL the router settled on, after any language redirect. */
function LocationProbe() {
  const { pathname, hash } = useLocation();
  return <span data-testid="location">{`${pathname}${hash}`}</span>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  );
}

/**
 * The Altegio booking route is behind an (off) feature flag, so the page is
 * mounted on its own rather than routed to — the widget, its consent gate
 * and the page itself all still ship and are still covered.
 */
function renderBookingPage() {
  return render(
    <ConsentProvider>
      <MemoryRouter initialEntries={["/en/booking"]}>
        <BookingPage />
      </MemoryRouter>
    </ConsentProvider>,
  );
}

/**
 * jsdom's navigator reports en-US and the tests start with empty storage,
 * so an unprefixed path redirects to the English tree.
 */
const currentPath = () => screen.getByTestId("location").textContent;

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
        `/en#${anchor.id}`,
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
      "/en#prices",
    );
  });

  it("renders the Altegio widget on the booking page once booking cookies are accepted", () => {
    window.localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ version: 1, decidedAt: new Date().toISOString(), booking: true }),
    );
    renderBookingPage();
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
    renderBookingPage();
    expect(screen.getByTestId("altegio-consent-placeholder")).toBeInTheDocument();
    expect(screen.queryByTestId("altegio-widget")).not.toBeInTheDocument();
  });

  it("hides the booking block while the Altegio feature flag is off", () => {
    renderAt("/");
    expect(
      screen.queryByRole("heading", { name: /book an appointment/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("altegio-consent-placeholder")).not.toBeInTheDocument();
    // Nothing may point at a section that is no longer on the page — the
    // hero CTA is repointed at the consultation request instead.
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toMatch(/#booking$|\/booking$/);
    }
    expect(
      screen.getAllByRole("link", { name: /get a consultation/i })[0],
    ).toHaveAttribute("href", "/en#consultation");
  });

  it("does not serve /booking while the flag is off", () => {
    renderAt("/booking");
    expect(
      screen.getByRole("heading", { level: 1, name: /page not found/i }),
    ).toBeInTheDocument();
  });

  it("links the four legal pages from the footer", () => {
    renderAt("/");
    const footer = screen.getByRole("navigation", { name: "Legal" });
    expect(within(footer).getByRole("link", { name: "Imprint" })).toHaveAttribute(
      "href",
      "/en/imprint",
    );
    expect(within(footer).getByRole("link", { name: "Privacy policy" })).toHaveAttribute(
      "href",
      "/en/privacy",
    );
    expect(within(footer).getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/en/terms",
    );
    expect(within(footer).getByRole("link", { name: "Mission" })).toHaveAttribute(
      "href",
      "/en/mission",
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

describe("language routing", () => {
  it("sends an unprefixed URL to the visitor's language, keeping the path", () => {
    renderAt("/prices");
    expect(currentPath()).toBe("/en/prices");
    expect(screen.getByRole("heading", { level: 1, name: /price list/i })).toBeInTheDocument();
  });

  it("sends the bare root to the language home page", () => {
    renderAt("/");
    expect(currentPath()).toBe("/en");
  });

  it("honours the language stored from an earlier visit", () => {
    window.localStorage.setItem("i18nextLng", "uk");
    renderAt("/contact");
    expect(currentPath()).toBe("/uk/contact");
  });

  it("drops a language the site does not have instead of 404ing", () => {
    // An old link to a locale that was never published still lands on the
    // page the visitor asked for, in a language the site does have.
    renderAt("/fr/prices");
    expect(currentPath()).toBe("/en/prices");
  });

  it("renders the page in the language its URL names, whatever is stored", () => {
    window.localStorage.setItem("i18nextLng", "en");
    renderAt("/de/prices");
    expect(currentPath()).toBe("/de/prices");
    expect(
      screen.getByRole("heading", { level: 1, name: "Preisliste" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("de");
  });

  it("keeps the query and the hash across the redirect", () => {
    renderAt("/prices?zone=beard#packages");
    expect(currentPath()).toBe("/en/prices#packages");
  });

  it("keeps an unknown page unknown instead of redirecting it home", () => {
    renderAt("/no-such-page");
    expect(currentPath()).toBe("/en/no-such-page");
    expect(
      screen.getByRole("heading", { level: 1, name: /page not found/i }),
    ).toBeInTheDocument();
  });

  it("404s inside the language tree rather than redirecting again", () => {
    renderAt("/en/no-such-page");
    expect(currentPath()).toBe("/en/no-such-page");
    expect(
      screen.getByRole("heading", { level: 1, name: /page not found/i }),
    ).toBeInTheDocument();
  });

  it("switching language moves to the same page under the new segment", async () => {
    renderAt("/prices");
    const user = userEvent.setup();
    await user.click(screen.getByTestId("language-switcher"));
    await user.click(screen.getByRole("option", { name: "Українська" }));
    expect(currentPath()).toBe("/uk/prices");
    expect(document.documentElement.lang).toBe("uk");
  });

  it("switches on to Russian without going through the redirect", async () => {
    renderAt("/uk/prices");
    const user = userEvent.setup();
    await user.click(screen.getByTestId("language-switcher"));
    await user.click(screen.getByRole("option", { name: "Русский" }));
    expect(currentPath()).toBe("/ru/prices");
    expect(document.documentElement.lang).toBe("ru");
    expect(
      screen.getByRole("heading", { level: 1, name: "Прайс-лист" }),
    ).toBeInTheDocument();
  });
});
