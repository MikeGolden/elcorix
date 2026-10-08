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
  it("shows the certificates as a stack with a caption next to the portrait", async () => {
    const section = await specialistSection();
    const stack = within(section).getByTestId("certificate-stack");
    // Top card carries the alt text; the card under it is decorative.
    expect(within(stack).getByAltText(en.specialist.certificates.alts.optical)).toHaveAttribute(
      "src",
      "/images/certificate.jpg",
    );
    expect(stack.querySelector('img[src="/images/certificate-skin.jpg"]')).toHaveAttribute("alt", "");
    expect(within(stack).getByText("2 certificates")).toBeInTheDocument();
    expect(within(section).getByText(en.specialist.certificates.title)).toBeInTheDocument();
    expect(within(section).getByAltText(en.specialist.imageAlt)).toBeInTheDocument();
  });

  it("opens the stack as a gallery of both certificates", async () => {
    const user = userEvent.setup();
    const section = await specialistSection();
    expect(screen.queryByTestId("lightbox")).toBeNull();

    await user.click(within(section).getByTestId("certificate-stack"));
    const viewer = screen.getByTestId("lightbox");
    const image = () => within(viewer).getByTestId("lightbox-image");
    expect(image()).toHaveAttribute("src", "/images/certificate.jpg");
    expect(within(viewer).getByText("1 of 2")).toBeInTheDocument();

    await user.click(within(viewer).getByRole("button", { name: en.lightbox.next }));
    expect(image()).toHaveAttribute("src", "/images/certificate-skin.jpg");
    expect(image()).toHaveAttribute("alt", en.specialist.certificates.alts.skin);

    await user.keyboard("{ArrowRight}");
    expect(image()).toHaveAttribute("src", "/images/certificate.jpg");

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("lightbox")).toBeNull();
  });

  it.each(Object.entries(locales))("has every certificate string and no placeholders in %s", (_lng, locale) => {
    expect(JSON.stringify(locale.specialist)).not.toMatch(/\[[^\]]*\]/);
    const c = locale.specialist.certificates;
    for (const value of [c.title, c.text, c.count_one, c.count_other, c.alts.optical, c.alts.skin]) {
      expect(value).toBeTruthy();
    }
    expect(locale.specialist).not.toHaveProperty("certificate");
  });
});
