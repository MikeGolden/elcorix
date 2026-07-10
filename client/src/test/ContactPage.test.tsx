import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, type Mock } from "vitest";
import ContactPage from "../pages/ContactPage";
import { business } from "../config";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function renderPage() {
  return render(
    <MemoryRouter>
      <ContactPage />
    </MemoryRouter>,
  );
}

describe("ContactPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows phone, e-mail and instagram links", () => {
    renderPage();
    expect(
      screen.getByRole("link", { name: new RegExp(escapeRegExp(business.phone)) }),
    ).toHaveAttribute("href", `tel:${business.phone.replace(/\s/g, "")}`);
    expect(
      screen.getByRole("link", { name: new RegExp(escapeRegExp(business.email)) }),
    ).toHaveAttribute("href", `mailto:${business.email}`);
    expect(
      screen.getByRole("link", { name: /kosmetic\.fuessen/i }),
    ).toHaveAttribute("href", business.instagram);
  });

  it("submits the contact form and shows a success message", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 1 }), { status: 201 }),
      );
    renderPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/name/i), "Anna");
    await user.type(screen.getByLabelText(/e-mail/i), "anna@example.com");
    await user.type(screen.getByLabelText(/message/i), "Hello!");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/thank you/i);
    const [url, init] = (fetchMock as Mock).mock.calls[0];
    expect(url).toBe("/api/contact");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      name: "Anna",
      email: "anna@example.com",
      message: "Hello!",
    });
  });

  it("shows an error message when the request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 500 }),
    );
    renderPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/name/i), "Anna");
    await user.type(screen.getByLabelText(/e-mail/i), "anna@example.com");
    await user.type(screen.getByLabelText(/message/i), "Hello!");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /something went wrong/i,
    );
  });
});
