import { addDays, addMonths, isOpenOn, monthGrid, parseIsoDate, toIsoDate } from "../calendar";

describe("calendar", () => {
  it("round-trips ISO dates and rejects days that do not exist", () => {
    expect(toIsoDate(parseIsoDate("2026-10-10")!)).toBe("2026-10-10");
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("10.10.2026")).toBeNull();
  });

  it("steps across month, year and DST boundaries by whole days", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    // Clocks go back in Germany on 25 October 2026.
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(addDays("2026-03-29", -1)).toBe("2026-03-28");
  });

  it("clamps to the end of a shorter month", () => {
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-10-15", -12)).toBe("2025-10-15");
  });

  it("lays a month out as six Monday-first weeks", () => {
    const weeks = monthGrid("2026-10-01");
    expect(weeks).toHaveLength(6);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    // 1 October 2026 is a Thursday.
    expect(weeks[0][0]).toBe("2026-09-28");
    expect(weeks[0][3]).toBe("2026-10-01");
    expect(weeks.map((week) => parseIsoDate(week[0])!.getDay())).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it("knows the studio is closed on Sundays and Mondays", () => {
    expect(isOpenOn("2026-10-04")).toBe(false); // Sunday
    expect(isOpenOn("2026-10-05")).toBe(false); // Monday
    expect(isOpenOn("2026-10-06")).toBe(true); // Tuesday
    expect(isOpenOn("2026-10-10")).toBe(true); // Saturday
  });
});
