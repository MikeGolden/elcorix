import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi, type Mock } from "vitest";
import ConsultationForm from "../components/ConsultationForm";

/**
 * The desktop time popover (components/TimePicker.tsx) replaces the native
 * select only where the pointer is a mouse — the same split as the date
 * field. ConsultationForm.test.tsx covers the select phones keep.
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

function hiddenTime(container: HTMLElement) {
  return container.querySelector<HTMLInputElement>('input[name="time"]')!;
}

describe("TimePicker (desktop time slots)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 8, 28, 10, 0) });
    stubPointer(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps the native select where the pointer is a finger", () => {
    stubPointer(false);
    renderForm();
    expect(screen.getByLabelText(/preferred time/i).tagName).toBe("SELECT");
  });

  it("opens a list of half-hour slots from a button labelled with the field", async () => {
    const { container } = renderForm();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /preferred time/i });
    expect(trigger).toHaveAccessibleName("Preferred time No preference");
    expect(hiddenTime(container)).toHaveValue("");

    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: /preferred time/i });
    const slots = within(dialog).getAllByRole("option");
    expect(slots.map((slot) => slot.textContent)).toEqual([
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
    ]);
    expect(slots[0]).toHaveFocus();
    expect(within(dialog).getByText("Open 09:00–19:00")).toBeInTheDocument();
    // Nothing chosen yet, so there is nothing to go back from.
    expect(within(dialog).queryByRole("button", { name: "No preference" })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("option", { name: "14:30" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAccessibleName("Preferred time 14:30");
    expect(hiddenTime(container)).toHaveValue("14:30");
  });

  it("is driven from the keyboard and reopens on the chosen slot", async () => {
    const { container } = renderForm();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /preferred time/i });
    trigger.focus();

    // 09:00 → down a row (4 slots) → 11:00 → right → 11:30.
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "09:00" })).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(screen.getByRole("option", { name: "11:30" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("option", { name: "18:30" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "18:30" })).toHaveFocus();
    await user.keyboard("{Home}{ArrowRight}{Enter}");
    expect(hiddenTime(container)).toHaveValue("09:30");
    expect(trigger).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    const chosen = screen.getByRole("option", { name: "09:30" });
    expect(chosen).toHaveFocus();
    expect(chosen).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("goes back to no preference, closes on a click outside, survives Safari's click-blur", async () => {
    const { container } = renderForm();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /preferred time/i });

    await user.click(trigger);
    fireEvent.blur(screen.getByRole("option", { name: "09:00" }), { relatedTarget: null });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "16:00" }));

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "No preference" }));
    expect(hiddenTime(container)).toHaveValue("");
    expect(trigger).toHaveAccessibleName("Preferred time No preference");

    await user.click(trigger);
    await user.click(screen.getByLabelText("Name"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("posts the chosen slot with the date and empties itself after sending", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }) as unknown as Mock;
    vi.stubGlobal("fetch", fetchMock);
    const { container } = renderForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText(/phone number/i), "+49 155 1234567");

    await user.click(screen.getByRole("button", { name: /preferred date/i }));
    await user.click(screen.getByRole("button", { name: "Wednesday, September 30, 2026" }));
    await user.click(screen.getByRole("button", { name: /preferred time/i }));
    await user.click(screen.getByRole("option", { name: "17:30" }));
    await user.click(screen.getByRole("button", { name: /get a consultation/i }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ preferredAt: "2026-09-30 17:30" });
    await screen.findByRole("status");
    expect(hiddenTime(container)).toHaveValue("");
    expect(screen.getByRole("button", { name: /preferred time/i })).toHaveTextContent(
      "No preference",
    );
  });
});
