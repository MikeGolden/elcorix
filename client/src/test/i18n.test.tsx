import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import LanguageSwitcher from "../components/LanguageSwitcher";
import i18n, { createI18nInstance } from "../i18n";

function renderApp() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>,
  );
}

describe("internationalization", () => {
  it("switches nav labels to German and persists the choice", async () => {
    renderApp();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Language" }));
    await user.click(screen.getByRole("option", { name: "Deutsch" }));

    const nav = screen.getByRole("navigation");
    expect(
      within(nav).getByRole("link", { name: "Startseite" }),
    ).toBeInTheDocument();
    expect(
      within(nav).getByRole("link", { name: "Termin buchen" }),
    ).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Kontakt" })).toBeInTheDocument();
    expect(window.localStorage.getItem("i18nextLng")).toBe("de");
  });

  it("updates the html lang attribute when the language changes", async () => {
    await i18n.changeLanguage("uk");
    expect(document.documentElement.lang).toBe("uk");
    await i18n.changeLanguage("de");
    expect(document.documentElement.lang).toBe("de");
  });

  it("defaults to German when nothing is stored and the browser language is unsupported", () => {
    Object.defineProperty(window.navigator, "language", {
      value: "fr-FR",
      configurable: true,
    });
    Object.defineProperty(window.navigator, "languages", {
      value: ["fr-FR"],
      configurable: true,
    });
    window.localStorage.clear();
    try {
      const instance = createI18nInstance();
      expect(instance.resolvedLanguage).toBe("de");
    } finally {
      Reflect.deleteProperty(window.navigator, "language");
      Reflect.deleteProperty(window.navigator, "languages");
    }
  });

  it("prefers the language persisted in localStorage over everything else", () => {
    window.localStorage.setItem("i18nextLng", "uk");
    const instance = createI18nInstance();
    expect(instance.resolvedLanguage).toBe("uk");
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
  it("renders all three language options with flag icons", async () => {
    render(<LanguageSwitcher />);
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
    ]);
    for (const option of options) {
      expect(option.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    }
    expect(within(listbox).getByRole("option", { name: "English" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<LanguageSwitcher />);
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Language" });
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
