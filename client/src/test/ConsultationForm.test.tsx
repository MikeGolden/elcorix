import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, type Mock } from "vitest";
import ConsultationForm from "../components/ConsultationForm";

function renderForm() {
  return render(
    <MemoryRouter>
      <ConsultationForm />
    </MemoryRouter>,
  );
}

describe("ConsultationForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requires the privacy consent and leaves the marketing opt-in optional", () => {
    renderForm();
    expect(screen.getByRole("checkbox", { name: /privacy policy/i })).toBeRequired();
    expect(screen.getByRole("checkbox", { name: /offers and news/i })).not.toBeRequired();
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("posts name, phone, preferred slot and marketing choice to the bookings API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 1234567");
    await user.type(screen.getByLabelText(/preferred date/i), "2026-09-15");
    await user.selectOptions(screen.getByLabelText(/preferred time/i), "10:30");
    await user.click(screen.getByRole("checkbox", { name: /offers and news/i }));
    await user.click(screen.getByRole("checkbox", { name: /privacy policy/i }));
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/bookings");
    expect(JSON.parse(String(init.body))).toMatchObject({
      customerName: "Anna",
      customerPhone: "+49 155 1234567",
      preferredAt: "2026-09-15 10:30",
      marketingConsent: true,
    });
    expect(await screen.findByRole("status")).toHaveTextContent(/thank you/i);
  });

  it("blocks submission and explains when the phone number is not a number", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "asdfgh");
    await user.click(screen.getByRole("checkbox", { name: /privacy policy/i }));
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText(/valid phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toHaveAttribute("aria-invalid", "true");

    await user.clear(screen.getByLabelText(/phone number/i));
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 625 14 872");
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("offers appointment times on the half hour only", () => {
    renderForm();
    const slots = screen
      .getAllByRole("option")
      .map((option) => (option as HTMLOptionElement).value)
      .filter(Boolean);
    expect(slots[0]).toBe("09:00");
    expect(slots.at(-1)).toBe("18:30");
    expect(slots.every((slot) => /^\d\d:(00|30)$/.test(slot))).toBe(true);
  });

  it("shows an error message when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    renderForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 1234567");
    await user.click(screen.getByRole("checkbox", { name: /privacy policy/i }));
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i);
  });
});
