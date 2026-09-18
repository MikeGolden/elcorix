import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { visitSteps } from "../sections/Specialist";
import en from "../i18n/locales/en/common.json";
import de from "../i18n/locales/de/common.json";
import uk from "../i18n/locales/uk/common.json";
import ru from "../i18n/locales/ru/common.json";

const locales = { en, de, uk, ru };

describe("Specialist section", () => {
  it("shows the visit steps in order and no certificate image", async () => {
    render(
      <MemoryRouter initialEntries={["/en"]}>
        <App />
      </MemoryRouter>,
    );
    const section = (await screen.findByRole("heading", { name: en.specialist.title })).closest("section")!;
    const card = within(section).getByRole("group", { name: en.specialist.visit.title });
    const items = within(card).getAllByRole("listitem");
    expect(items.map((li) => li.querySelector("p")?.textContent)).toEqual(
      visitSteps.map((step) => en.specialist.visit.steps[step].title),
    );
    expect(section.querySelector('img[src*="certificate"]')).toBeNull();
  });

  it.each(Object.entries(locales))("has no unfilled placeholders in %s", (_lng, locale) => {
    expect(JSON.stringify(locale.specialist)).not.toMatch(/\[[^\]]*\]/);
    for (const step of visitSteps) {
      expect(locale.specialist.visit.steps[step].title).toBeTruthy();
      expect(locale.specialist.visit.steps[step].text).toBeTruthy();
    }
  });
});
