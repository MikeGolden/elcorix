import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { CONSENT_STORAGE_KEY, type ConsentState } from "../consent/ConsentContext";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function storedConsent(): ConsentState | null {
  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return raw === null ? null : (JSON.parse(raw) as ConsentState);
}

function storeConsent(booking: boolean) {
  window.localStorage.setItem(
    CONSENT_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      decidedAt: new Date().toISOString(),
      booking,
    } satisfies ConsentState),
  );
}

describe("cookie consent banner", () => {
  it("appears on the first visit with equal accept/reject choices", () => {
    renderAt("/");
    const banner = screen.getByRole("dialog", {
      name: /cookies & external services/i,
    });
    expect(
      within(banner).getByRole("button", { name: "Accept all" }),
    ).toBeInTheDocument();
    expect(
      within(banner).getByRole("button", { name: "Only necessary" }),
    ).toBeInTheDocument();
    expect(
      within(banner).getByRole("link", { name: /privacy policy/i }),
    ).toHaveAttribute("href", "/en/privacy");
  });

  it("does not appear when a decision is already stored", () => {
    storeConsent(false);
    renderAt("/");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("persists 'accept all' and closes", async () => {
    renderAt("/");
    await userEvent.click(screen.getByRole("button", { name: "Accept all" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(storedConsent()?.booking).toBe(true);
    expect(storedConsent()?.decidedAt).toBeTruthy();
  });

  it("persists 'only necessary' and closes", async () => {
    renderAt("/");
    await userEvent.click(screen.getByRole("button", { name: "Only necessary" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(storedConsent()?.booking).toBe(false);
  });

  it("can be reopened from the footer to change the decision", async () => {
    storeConsent(false);
    renderAt("/");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cookie settings" }));
    await userEvent.click(screen.getByRole("button", { name: "Accept all" }));
    expect(storedConsent()?.booking).toBe(true);
  });
});

describe("Altegio embed consent gate", () => {
  it("shows a placeholder instead of the iframe without consent", () => {
    storeConsent(false);
    renderAt("/booking");
    expect(screen.getByTestId("altegio-consent-placeholder")).toBeInTheDocument();
    expect(screen.queryByTestId("altegio-widget")).not.toBeInTheDocument();
    // The no-cookie fallback link must still be offered.
    expect(
      screen.getByRole("link", { name: /booking calendar in a new tab/i }),
    ).toHaveAttribute("href", expect.stringContaining("alteg.io"));
  });

  it("loads the iframe after consenting via the placeholder button", async () => {
    storeConsent(false);
    renderAt("/booking");
    await userEvent.click(
      screen.getByRole("button", { name: /load calendar and accept/i }),
    );
    expect(screen.getByTestId("altegio-widget")).toBeInTheDocument();
    expect(storedConsent()?.booking).toBe(true);
  });

  it("loads the iframe directly when consent was given earlier", () => {
    storeConsent(true);
    renderAt("/booking");
    expect(screen.getByTestId("altegio-widget")).toBeInTheDocument();
    expect(
      screen.queryByTestId("altegio-consent-placeholder"),
    ).not.toBeInTheDocument();
  });
});

describe("legal pages", () => {
  it("renders the privacy policy with the controller's details", () => {
    storeConsent(true);
    renderAt("/privacy");
    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy policy" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/controller responsible/i)).toBeInTheDocument();
  });

  it("renders the imprint with operator, contact and VAT id", () => {
    storeConsent(true);
    renderAt("/imprint");
    expect(
      screen.getByRole("heading", { level: 1, name: "Imprint" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/DE000000000/)).toBeInTheDocument();
  });

  it("links to privacy and imprint from the footer", () => {
    storeConsent(true);
    renderAt("/");
    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer).getByRole("link", { name: "Privacy policy" }),
    ).toHaveAttribute("href", "/en/privacy");
    expect(within(footer).getByRole("link", { name: "Imprint" })).toHaveAttribute(
      "href",
      "/en/imprint",
    );
  });
});
