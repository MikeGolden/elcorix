import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import App from "../App";
import { reasons, situations } from "../content";
import { forWhomRoutes, siteRoutes } from "../seo/routes";
import { localizedRoutePath } from "../seo/routePaths";
import { supportedLanguages } from "../i18n/routing";
import en from "../i18n/locales/en/common.json";
import de from "../i18n/locales/de/common.json";
import uk from "../i18n/locales/uk/common.json";
import ru from "../i18n/locales/ru/common.json";

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

const currentPath = () => screen.getByTestId("location").textContent;

describe("For-whom pages", () => {
  it("gives every landing-page card its own route in the route table", () => {
    for (const reason of reasons) {
      const route = forWhomRoutes[reason.key];
      expect(siteRoutes.some((entry) => entry.path === route.path)).toBe(true);
    }
    const paths = Object.values(forWhomRoutes).map((route) => route.path);
    expect(new Set(paths).size).toBe(reasons.length);
  });

  it("has the article copy and page meta in every language", () => {
    const locales = { en, de, uk, ru };
    expect(Object.keys(locales).sort()).toEqual([...supportedLanguages].sort());
    for (const locale of Object.values(locales)) {
      expect(locale.forWhom.article.intro).not.toBe("");
      expect(locale.forWhom.article.outro).not.toBe("");
      for (const situation of situations) {
        expect(locale.forWhom.situations[situation].title).not.toBe("");
        expect(locale.forWhom.situations[situation].body).not.toBe("");
      }
      for (const { metaKey } of Object.values(forWhomRoutes)) {
        expect(locale.meta[metaKey].title).not.toBe("");
        expect(locale.meta[metaKey].description.length).toBeLessThanOrEqual(170);
      }
    }
  });

  it("links each card on the home page to its page, in the current language", () => {
    renderAt("/en");
    const section = document.getElementById("for-whom")!;
    const links = within(section).getAllByRole("link", { name: /learn more/i });
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      reasons.map((reason) => `/en${forWhomRoutes[reason.key].path}`),
    );
  });

  it("renders the overview article with all six situations", () => {
    renderAt(`/en${forWhomRoutes.convenience.path}`);
    expect(
      screen.getByRole("heading", { level: 1, name: en.forWhom.items.convenience.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.forWhom.article.intro)).toBeInTheDocument();
    for (const situation of situations) {
      expect(
        screen.getByRole("heading", { level: 2, name: en.forWhom.situations[situation].title }),
      ).toBeInTheDocument();
    }
    expect(screen.getByText(en.forWhom.article.outro)).toBeInTheDocument();
    expect(document.title).toBe(`${en.meta.forWhomConvenience.title} — elcorix`);
  });

  it("renders one situation per detail page and links to the other three", () => {
    renderAt(`/ru${forWhomRoutes.beard.path}`);
    expect(
      screen.getByRole("heading", { level: 1, name: ru.forWhom.situations.beard.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(ru.forWhom.situations.beard.body)).toBeInTheDocument();
    // The other situations are not repeated on a detail page.
    expect(screen.queryByText(ru.forWhom.situations.face.body)).not.toBeInTheDocument();

    const others = within(
      screen.getByRole("region", { name: ru.forWhom.others }),
    ).getAllByRole("link");
    expect(others.map((link) => link.getAttribute("href"))).toEqual(
      reasons
        .filter((reason) => reason.key !== "beard")
        .map((reason) => localizedRoutePath("ru", forWhomRoutes[reason.key].path)),
    );
  });

  it("navigates from a card to its page and back to the section", async () => {
    const user = userEvent.setup();
    renderAt("/en");
    const section = document.getElementById("for-whom")!;
    await user.click(within(section).getAllByRole("link", { name: /learn more/i })[1]);
    expect(currentPath()).toBe(`/en${forWhomRoutes.irritation.path}`);
    expect(
      screen.getByRole("heading", { level: 1, name: en.forWhom.situations.irritation.title }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: en.forWhom.title }));
    expect(currentPath()).toBe("/en#for-whom");
  });
});
