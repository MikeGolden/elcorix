import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "../App";
import en from "../i18n/locales/en/common.json";
import de from "../i18n/locales/de/common.json";
import uk from "../i18n/locales/uk/common.json";
import ru from "../i18n/locales/ru/common.json";

const locales = { en, de, uk, ru };

async function specialistSection() {
  render(
    <MemoryRouter initialEntries={["/en"]}>
      <App />
    </MemoryRouter>,
  );
  return (await screen.findByRole("heading", { name: en.specialist.title })).closest("section")!;
}

describe("Specialist section", () => {
  it("shows the certificate with its caption next to the portrait", async () => {
    const section = await specialistSection();
    const certificate = within(section).getByAltText(en.specialist.certificate.alt);
    expect(certificate.getAttribute("src")).toBe("/images/certificate.jpg");
    expect(within(section).getByText(en.specialist.certificate.title)).toBeInTheDocument();
    expect(within(section).getByAltText(en.specialist.imageAlt)).toBeInTheDocument();
  });

  it("opens the certificate full screen and closes it again", async () => {
    const user = userEvent.setup();
    const section = await specialistSection();
    expect(screen.queryByTestId("lightbox")).toBeNull();

    await user.click(within(section).getByTestId("certificate-tile"));
    const viewer = screen.getByTestId("lightbox");
    expect(within(viewer).getByTestId("lightbox-image")).toHaveAttribute("src", "/images/certificate.jpg");
    // One image: no paging arrows, no "1 of 1".
    expect(within(viewer).queryByRole("button", { name: en.lightbox.next })).toBeNull();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("lightbox")).toBeNull();
  });

  it.each(Object.entries(locales))("has every certificate string and no placeholders in %s", (_lng, locale) => {
    expect(JSON.stringify(locale.specialist)).not.toMatch(/\[[^\]]*\]/);
    for (const key of ["alt", "title", "text"] as const) {
      expect(locale.specialist.certificate[key]).toBeTruthy();
    }
    expect(locale.specialist).not.toHaveProperty("visit");
  });
});
