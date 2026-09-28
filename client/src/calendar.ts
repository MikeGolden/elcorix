/**
 * Plain date arithmetic for the consultation form's calendar
 * (components/DatePicker.tsx). Dates travel as `YYYY-MM-DD` strings — the
 * same shape `<input type="date">` produces and the bookings API expects —
 * and are only turned into `Date` objects at local midnight, so no time zone
 * or DST change can move a day.
 */
import { staticBusiness } from "./business";

export type IsoDate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toIsoDate(date: Date): IsoDate {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** `null` for anything that is not a real calendar day ("2026-02-30"). */
export function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
    ? date
    : null;
}

export function addDays(value: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(value)!;
  return toIsoDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

/**
 * The same day `months` later, clamped to the end of a shorter month —
 * 31 January + 1 month is 28/29 February, not 3 March.
 */
export function addMonths(value: IsoDate, months: number): IsoDate {
  const date = parseIsoDate(value)!;
  const first = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return toIsoDate(new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), lastDay)));
}

/** First day of the month the date falls in. */
export function startOfMonth(value: IsoDate): IsoDate {
  return `${value.slice(0, 7)}-01`;
}

/**
 * Six Monday-first weeks covering the month of `monthStart` — always 42
 * days, so the popover never changes height while paging through months.
 * Germany starts the week on Monday (DIN 1355 / ISO 8601), and so does
 * every language the site speaks.
 */
export function monthGrid(monthStart: IsoDate): IsoDate[][] {
  const first = parseIsoDate(startOfMonth(monthStart))!;
  const offset = (first.getDay() + 6) % 7; // Monday → 0 … Sunday → 6
  const gridStart = toIsoDate(new Date(first.getFullYear(), first.getMonth(), 1 - offset));
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
  );
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const OPEN_WEEKDAYS: ReadonlySet<number> = new Set(
  staticBusiness.openingHours.flatMap((slot) =>
    slot.days.map((day) => WEEKDAYS.indexOf(day)),
  ),
);

/** Whether the studio opens at all on that day of the week. */
export function isOpenOn(value: IsoDate): boolean {
  return OPEN_WEEKDAYS.has(parseIsoDate(value)!.getDay());
}
