import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LegalDocument, { numberSections } from "../components/LegalDocument";

function renderPolicy(analytics: boolean) {
  return render(
    <MemoryRouter initialEntries={["/de/datenschutz"]}>
      <LegalDocument document="privacy" features={{ altegio: false, analytics }} />
    </MemoryRouter>,
  );
}

describe("privacy policy × analytics flag", () => {
  it("describes Umami only when the build contains the tracker", async () => {
    renderPolicy(true);
    expect(
      await screen.findByRole("heading", { name: "11. Reichweitenmessung mit Umami" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "12. OpenStreetMap" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "20. Aktualisierung dieser Datenschutzerklärung" }),
    ).toBeInTheDocument();
  });

  it("closes the gap when the section is hidden", async () => {
    renderPolicy(false);
    expect(await screen.findByRole("heading", { name: "11. OpenStreetMap" })).toBeInTheDocument();
    expect(screen.queryByText(/Umami/)).toBeNull();
    expect(
      screen.getByRole("heading", { name: "19. Aktualisierung dieser Datenschutzerklärung" }),
    ).toBeInTheDocument();
  });

  it("leaves unnumbered or complete documents as written", () => {
    const plain = [{ title: "Vorbemerkung" }, { title: "2. Zweites" }];
    expect(numberSections(plain)).toBe(plain);
    const full = [{ title: "1. Eins" }, { title: "2. Zwei" }];
    expect(numberSections(full)).toEqual(full);
  });
});
