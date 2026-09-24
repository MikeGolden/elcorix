import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { faqSets } from "../faq";
import en from "../i18n/locales/en/common.json";
import de from "../i18n/locales/de/common.json";
import uk from "../i18n/locales/uk/common.json";
import ru from "../i18n/locales/ru/common.json";

const locales = { en, de, uk, ru };

async function faqSection(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  const heading = await screen.findByRole("heading", { name: en.faq.title });
  return heading.closest("section")!;
}

describe("FAQ", () => {
  it("shows the landing-page questions, collapsed, with the answer in the markup", async () => {
    const section = await faqSection("/en");
    const details = section.querySelectorAll("details");
    expect([...details].map((d) => d.querySelector("summary")?.textContent)).toEqual(
      faqSets.home.map((key) => en.faq.items[key].question),
    );
    // Collapsed, but the answer is still in the document for crawlers.
    expect(details[0]!.open).toBe(false);
    expect(within(section).getByText(en.faq.items.pain.answer)).toBeInTheDocument();

    fireEvent.click(within(section).getByText(en.faq.items.pain.question));
    expect(details[0]!.open).toBe(true);
  });

  it("shows the price questions on the price page", async () => {
    const section = await faqSection("/en/prices");
    expect([...section.querySelectorAll("summary")].map((s) => s.textContent)).toEqual(
      faqSets.prices.map((key) => en.faq.items[key].question),
    );
  });

  it.each(Object.entries(locales))("has every question answered in %s", (_lng, locale) => {
    for (const key of [...faqSets.home, ...faqSets.prices]) {
      expect(locale.faq.items[key].question).toMatch(/\?$/);
      expect(locale.faq.items[key].answer.length).toBeGreaterThan(40);
    }
  });
});
