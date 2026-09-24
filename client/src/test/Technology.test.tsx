import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import en from "../i18n/locales/en/common.json";
import de from "../i18n/locales/de/common.json";
import uk from "../i18n/locales/uk/common.json";
import ru from "../i18n/locales/ru/common.json";

const locales = { en, de, uk, ru };

describe("Technology section", () => {
  it("shows the short pitch and opens the full write-up on demand", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/en"]}>
        <App />
      </MemoryRouter>,
    );
    const section = (await screen.findByRole("heading", { level: 2, name: en.technology.title })).closest(
      "section",
    )!;
    expect(within(section).getByText(en.technology.lead)).toBeVisible();
    expect(within(section).getByText(en.technology.consultationFirst)).toBeVisible();

    const toggle = within(section).getByRole("button", { name: en.technology.more.show });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Collapsed, but already in the markup for crawlers. jsdom loads no
    // Tailwind, so the collapse is asserted through the `hidden` utility.
    const panel = section.querySelector("#technology-more")!;
    expect(panel).toHaveClass("hidden");
    expect(panel).toHaveTextContent(en.technology.more.disclaimer);

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName(en.technology.more.hide);
    expect(panel).not.toHaveClass("hidden");
    const region = within(section).getByRole("region", { name: en.technology.more.title });
    for (const title of [en.technology.more.laser.title, en.technology.more.ipl.title, en.technology.more.facts.title]) {
      expect(within(region).getByRole("heading", { level: 4, name: title })).toBeVisible();
    }
    expect(within(region).getAllByRole("listitem")).toHaveLength(
      en.technology.more.laser.checks.length +
        en.technology.more.ipl.checks.length +
        en.technology.more.facts.sessions.length +
        en.technology.more.facts.explain.length,
    );

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveClass("hidden");
  });

  it.each(Object.entries(locales))("names the device and both technologies in %s", (_lng, locale) => {
    expect(locale.technology.lead).toContain("ALIX TWIN");
    expect(locale.technology.lead).toContain("IPL");
    expect(locale.technology.more.intro).toContain("ALIX TWIN AI Smart 5000 8W");
    expect(locale.technology.more.laser.p1).toMatch(/755, 808, 940 .* 1064/);
    expect(locale.technology.more.laser.p3).toContain("−26 °C");
  });
});
