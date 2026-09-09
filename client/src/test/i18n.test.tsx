import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import LanguageSwitcher from "../components/LanguageSwitcher";
import i18n, { createI18nInstance } from "../i18n";

function renderApp(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function renderSwitcher(path = "/en") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageSwitcher />
    </MemoryRouter>,
  );
}

describe("internationalization", () => {
  it("switches nav labels to German and persists the choice", async () => {
    renderApp();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Language" }));
    await user.click(screen.getByRole("option", { name: "Deutsch" }));

    // The anchor menu is collapsed until the hamburger is pressed.
    await user.click(screen.getByTestId("menu-toggle"));
    const nav = screen.getByRole("navigation", { name: "Menü" });
    expect(
      within(nav).getByRole("link", { name: "Für wen ist es geeignet?" }),
    ).toBeInTheDocument();
    expect(
      within(nav).getByRole("link", { name: "Unsere Preisliste" }),
    ).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Kontakt" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Dauerhafte Laser-Haarentfernung in Kempten",
      }),
    ).toBeInTheDocument();
    // The URL carries the language now; localStorage only remembers it for
    // the next visit to an unprefixed URL.
    expect(window.localStorage.getItem("i18nextLng")).toBe("de");
  });

  it("renders the language named by the URL, not the one that was stored", () => {
    window.localStorage.setItem("i18nextLng", "en");
    renderApp("/uk");
    expect(screen.getByRole("heading", { name: "Кому це підходить?" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("uk");
  });

  it("renders Russian under /ru — a separate locale, not the Ukrainian one", () => {
    renderApp("/ru");
    expect(screen.getByRole("heading", { name: "Кому это подходит?" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("ru");
    // Cyrillic is not enough: /ru must not fall through to the uk bundle.
    expect(screen.queryByRole("heading", { name: "Кому це підходить?" })).toBeNull();
  });

  it("updates the html lang attribute when the language changes", async () => {
    await i18n.changeLanguage("uk");
    expect(document.documentElement.lang).toBe("uk");
    await i18n.changeLanguage("de");
    expect(document.documentElement.lang).toBe("de");
  });

  it("starts a fresh instance in German unless told otherwise", () => {
    // The URL decides the language (see routing.test.ts); an instance
    // created without one is German, the business's own language.
    expect(createI18nInstance().resolvedLanguage).toBe("de");
    expect(createI18nInstance(false, "uk").resolvedLanguage).toBe("uk");
    expect(createI18nInstance(false, "ru").resolvedLanguage).toBe("ru");
  });

  it("falls back to English for keys missing in the active language", async () => {
    const instance = createI18nInstance();
    await instance.changeLanguage("de");
    instance.addResource("en", "common", "testOnly.english", "English only");
    const translate = instance.t as unknown as (key: string) => string;
    expect(translate("testOnly.english")).toBe("English only");
  });
});

describe("LanguageSwitcher", () => {
  it("renders every language option with an icon", async () => {
    renderSwitcher();
    const user = userEvent.setup();

    const trigger = screen.getByRole("button", { name: "Language" });
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    await user.click(trigger);

    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options.map((option) => option.getAttribute("aria-label"))).toEqual([
      "English",
      "Deutsch",
      "Українська",
      "Русский",
    ]);
    for (const option of options) {
      expect(option.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    }
    expect(within(listbox).getByRole("option", { name: "English" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("marks the language of the current URL as selected", async () => {
    renderSwitcher("/uk/prices");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Language" }));
    expect(screen.getByRole("option", { name: "Українська" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("marks Russian as selected under /ru", async () => {
    renderSwitcher("/ru/prices");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Language" }));
    expect(screen.getByRole("option", { name: "Русский" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderSwitcher();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Language" });
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
