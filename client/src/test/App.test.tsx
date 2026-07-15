import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { business } from "../config";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  it("renders hero, who we are and what we do on the home page", () => {
    renderAt("/");
    expect(
      screen.getByRole("heading", { level: 1, name: business.name }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /who we are/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /what we do/i }),
    ).toBeInTheDocument();
  });

  it("has navigation links to booking and contact", () => {
    renderAt("/");
    const nav = screen.getByRole("navigation", { name: /main navigation/i });
    expect(
      within(nav).getByRole("link", { name: /book an appointment/i }),
    ).toHaveAttribute("href", "/booking");
    expect(
      within(nav).getByRole("link", { name: /prices/i }),
    ).toHaveAttribute("href", "/prices");
    expect(
      within(nav).getByRole("link", { name: /gallery/i }),
    ).toHaveAttribute("href", "/gallery");
    expect(
      within(nav).getByRole("link", { name: /^contact$/i }),
    ).toHaveAttribute("href", "/contact");
  });

  it("renders the Altegio widget on the booking page once booking cookies are accepted", () => {
    window.localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ version: 1, decidedAt: new Date().toISOString(), booking: true }),
    );
    renderAt("/booking");
    expect(
      screen.getByRole("heading", { level: 1, name: /book an appointment/i }),
    ).toBeInTheDocument();
    const iframe = screen.getByTestId("altegio-widget");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("alteg.io"),
    );
  });
});
