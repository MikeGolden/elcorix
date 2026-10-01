import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi, type Mock } from "vitest";
import ConsultationForm from "../components/ConsultationForm";

/**
 * The desktop calendar replaces the native date input only where the
 * pointer is a mouse. jsdom has no matchMedia, so these tests provide one;
 * ConsultationForm.test.tsx covers the native input phones keep.
 */
function stubPointer(fine: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: fine,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function renderForm() {
  return render(
    <MemoryRouter>
      <ConsultationForm />
    </MemoryRouter>,
  );
}

async function fillContact(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Anna");
  await user.type(screen.getByLabelText(/phone number/i), "+49 155 1234567");
}

describe("DatePicker (desktop calendar)", () => {
  beforeEach(() => {
    // Monday 28 September 2026, mid-morning — a closed day, so the first
    // selectable one is Tuesday the 29th.
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 8, 28, 10, 0) });
    stubPointer(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps the native input where the pointer is a finger", () => {
    stubPointer(false);
    renderForm();
    expect(screen.getByLabelText(/preferred date/i)).toHaveAttribute("type", "date");
  });

  it("opens a calendar of the current month from a button labelled with the field", async () => {
    renderForm();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /preferred date/i });
    expect(trigger).toHaveAccessibleName("Preferred date Choose a date");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: /preferred date/i });
    expect(within(dialog).getByText("September 2026")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    // Focus lands on the first day the studio would take.
    expect(within(dialog).getByRole("button", { name: "Tuesday, September 29, 2026" })).toHaveFocus();
  });

  it("does not let a past or closed day be picked", async () => {
    renderForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /preferred date/i }));
    const dialog = screen.getByRole("dialog");

    const yesterday = within(dialog).getByRole("button", { name: "Sunday, September 27, 2026" });
    const today = within(dialog).getByRole("button", { name: "Monday, September 28, 2026" });
    expect(yesterday).toHaveAttribute("aria-disabled", "true");
    expect(today).toHaveAttribute("aria-disabled", "true");
    expect(today).toHaveAttribute("aria-current", "date");
    expect(within(dialog).getByRole("button", { name: /previous month/i })).toBeDisabled();

    await user.click(yesterday);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("posts the picked day and time, then empties the field for the next request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const user = userEvent.setup();
    await fillContact(user);

    const trigger = screen.getByRole("button", { name: /preferred date/i });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: /next month/i }));
    expect(screen.getByText("October 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Saturday, October 10, 2026" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent("Sat, October 10, 2026");

    await user.click(screen.getByRole("button", { name: /preferred time/i }));
    await user.click(screen.getByRole("option", { name: "11:30" }));
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ preferredAt: "2026-10-10 11:30" });
    await screen.findByRole("status");
    expect(trigger).toHaveTextContent("Choose a date");
  });

  it("is driven entirely from the keyboard", async () => {
    renderForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /preferred date/i }));

    // Tue 29 Sep → +7 → Tue 6 Oct → +1 → Wed 7 Oct.
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(screen.getByText("October 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wednesday, October 7, 2026" })).toHaveFocus();
    await user.keyboard("{Enter}");

    const trigger = screen.getByRole("button", { name: /preferred date/i });
    expect(trigger).toHaveTextContent("Wed, October 7, 2026");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Wednesday, October 7, 2026" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("pages months even when a click leaves focus nowhere (Safari)", async () => {
    // macOS Safari never focuses a <button> on click: pressing the month
    // arrow blurs the focused day with no relatedTarget. That used to close
    // the popover on mousedown and swallow the click.
    renderForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /preferred date/i }));
    const day = screen.getByRole("button", { name: "Tuesday, September 29, 2026" });
    expect(day).toHaveFocus();

    fireEvent.blur(day, { relatedTarget: null });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next month/i }));
    expect(screen.getByText("October 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /previous month/i }));
    expect(screen.getByText("September 2026")).toBeInTheDocument();
  });

  it("closes when Tab moves focus out of it", async () => {
    renderForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /preferred date/i }));
    const day = screen.getByRole("button", { name: "Tuesday, September 29, 2026" });
    fireEvent.blur(day, { relatedTarget: screen.getByLabelText("Name") });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on a click outside and can be cleared again", async () => {
    renderForm();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /preferred date/i });

    await user.click(trigger);
    await user.click(screen.getByLabelText("Name"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Wednesday, September 30, 2026" }));
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: /clear date/i }));
    expect(trigger).toHaveTextContent("Choose a date");
  });

  it("still asks for a day when only a time was chosen", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    const user = userEvent.setup();
    await fillContact(user);
    await user.click(screen.getByRole("button", { name: /preferred time/i }));
    await user.click(screen.getByRole("option", { name: "10:30" }));
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    const trigger = screen.getByRole("button", { name: /preferred date/i });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Wednesday, September 30, 2026" }));
    expect(screen.queryByText(/also choose a date/i)).not.toBeInTheDocument();
  });
});
