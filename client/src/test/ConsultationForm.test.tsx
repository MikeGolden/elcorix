import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, type Mock } from "vitest";
import ConsultationForm from "../components/ConsultationForm";

/** A date the form's own "not in the past" rule will still accept. */
function futureDate(daysAhead = 7): string {
  const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

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

  it("links the privacy policy instead of asking for consent, and keeps the phone-only opt-in optional", () => {
    renderForm();
    // Processing a request rests on Art. 6 (1) (b) GDPR, not on consent.
    expect(screen.queryByRole("checkbox", { name: /privacy policy/i })).toBeNull();
    const optIn = screen.getByRole("checkbox", { name: /by phone about offers and news/i });
    expect(optIn).not.toBeRequired();
    expect(optIn).not.toBeChecked();
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/en/privacy",
    );
  });

  it("posts name, phone, preferred slot and marketing choice to the bookings API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 1234567");
    const date = futureDate();
    await user.type(screen.getByLabelText(/preferred date/i), date);
    await user.selectOptions(screen.getByLabelText(/preferred time/i), "10:30");
    await user.click(screen.getByRole("checkbox", { name: /offers and news/i }));
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/bookings");
    expect(JSON.parse(String(init.body))).toMatchObject({
      customerName: "Anna",
      customerPhone: "+49 155 1234567",
      preferredAt: `${date} 10:30`,
      marketingConsent: true,
    });
    expect(await screen.findByRole("status")).toHaveTextContent(/thank you/i);
  });

  it("counts a sent request as a conversion without any of its content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const umamiTrack = vi.fn();
    vi.stubGlobal("umami", { track: umamiTrack });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 1234567");
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));
    await screen.findByRole("status");

    expect(umamiTrack).toHaveBeenCalledTimes(1);
    expect(umamiTrack).toHaveBeenCalledWith("consultation-request", { preferredDate: "no" });
    expect(JSON.stringify(umamiTrack.mock.calls)).not.toMatch(/Anna|1234567/);
    vi.unstubAllGlobals();
  });

  it("does not count a request the API rejected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const umamiTrack = vi.fn();
    vi.stubGlobal("umami", { track: umamiTrack });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 1234567");
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));
    await screen.findByRole("alert");

    expect(umamiTrack).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("blocks submission and explains when the phone number is not a number", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "asdfgh");
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText(/valid phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toHaveAttribute("aria-invalid", "true");

    await user.clear(screen.getByLabelText(/phone number/i));
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 625 14 872");
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("will not send a time without the day it belongs to", async () => {
    // "14:00" on its own tells staff nothing, and the API rejects it.
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 1234567");
    await user.selectOptions(screen.getByLabelText(/preferred time/i), "10:30");
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/also choose a date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred date/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("clears the date error as soon as a date is picked", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 1234567");
    await user.selectOptions(screen.getByLabelText(/preferred time/i), "10:30");
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));
    expect(screen.getByText(/also choose a date/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/preferred date/i), futureDate());
    expect(screen.queryByText(/also choose a date/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /get a consultation/i }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuses a date in the past, whichever layer catches it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    const { container } = renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 1234567");
    await user.type(screen.getByLabelText(/preferred date/i), futureDate(-30));

    // First layer: the `min` attribute makes the field natively invalid, so
    // clicking submit never reaches the handler.
    const dateField = screen.getByLabelText(/preferred date/i) as HTMLInputElement;
    expect(dateField.validity.rangeUnderflow).toBe(true);
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));
    expect(fetchMock).not.toHaveBeenCalled();

    // Second layer: `min` is only a hint some browsers skip, so submit the
    // form directly — bypassing constraint validation the way they would —
    // and the form's own check must still stop it.
    fireEvent.submit(container.querySelector("form")!);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/not in the past/i)).toBeInTheDocument();
  });

  it("puts today's date on the picker's lower bound", () => {
    renderForm();
    expect(screen.getByLabelText(/preferred date/i)).toHaveAttribute(
      "min",
      futureDate(0),
    );
  });

  it("offers appointment times on the half hour only", () => {
    renderForm();
    // Scope to the time select: the phone field's country code is a select
    // of its own and its options would otherwise land in this list.
    const slots = Array.from(
      (screen.getByLabelText(/preferred time/i) as HTMLSelectElement).options,
    )
      .map((option) => option.value)
      .filter(Boolean);
    expect(slots[0]).toBe("09:00");
    expect(slots.at(-1)).toBe("18:30");
    expect(slots.every((slot) => /^\d\d:(00|30)$/.test(slot))).toBe(true);
  });

  it("sends the number with the country code picked next to it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const user = userEvent.setup();

    // Germany is the default — the studio is in Füssen.
    expect(screen.getByLabelText(/country code/i)).toHaveValue("DE");

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.selectOptions(screen.getByLabelText(/country code/i), "UA");
    await user.type(screen.getByLabelText(/phone number/i), "50 123 4567");
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      customerPhone: "+380 50 123 4567",
    });
  });

  it("drops the trunk zero people type out of habit", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "0155 1234567");
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      customerPhone: "+49 155 1234567",
    });
  });

  it("moves a country code typed into the number field into the selector", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "+43 660 1234567");
    expect(screen.getByLabelText(/country code/i)).toHaveValue("AT");
    // Typed digit by digit, so what follows the code keeps its spacing.
    expect(screen.getByLabelText(/phone number/i)).toHaveValue("660 1234567");

    await user.click(screen.getByRole("button", { name: /get a consultation/i }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      customerPhone: "+43 660 1234567",
    });
  });

  it("shows an error message when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    renderForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 1234567");
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i);
  });
});
