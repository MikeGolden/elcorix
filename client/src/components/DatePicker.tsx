import {
  KeyboardEvent,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  type IsoDate,
  addDays,
  addMonths,
  isOpenOn,
  monthGrid,
  parseIsoDate,
  startOfMonth,
} from "../calendar";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { POPOVER_CLASS, useFinePointer, useFormReset, usePopoverDismiss } from "./pickerPopover";

type Props = {
  id: string;
  name: string;
  /** Earliest selectable day, `YYYY-MM-DD`. */
  min: IsoDate;
  /** The visible <label>'s id, so the trigger announces label + value. */
  labelId: string;
  invalid?: boolean;
  describedBy?: string;
  /** Fired whenever the value changes — the form clears its date error. */
  onChange?: () => void;
};

/**
 * Desktop browsers draw `<input type="date">`'s calendar as browser chrome
 * — Chrome's grey Win95-style grid, Safari's tiny popover — and none of it
 * can be styled. Phones hand the same input to the OS wheel/sheet, which is
 * the best picker there is. So: the native input wherever the primary
 * pointer is a finger, and our own calendar where it is a mouse.
 *
 * The first render is the native input on both sides (the server has no
 * pointer to ask), which keeps hydration exact and leaves a working field
 * for visitors without JavaScript; the swap happens after mount.
 */
export default function DateField(props: Props) {
  const finePointer = useFinePointer();
  if (!finePointer) {
    return (
      <input
        id={props.id}
        name={props.name}
        type="date"
        min={props.min}
        aria-invalid={props.invalid || undefined}
        aria-describedby={props.describedBy}
        onChange={() => props.onChange?.()}
        className="field"
      />
    );
  }
  return <DatePicker {...props} />;
}

function capitalize(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

function DatePicker({ id, name, min, labelId, invalid, describedBy, onChange }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [value, setValue] = useState<IsoDate>("");
  const [open, setOpen] = useState(false);
  // The day that holds keyboard focus inside the grid (roving tabindex).
  const [active, setActive] = useState<IsoDate>(min);
  const [month, setMonth] = useState<IsoDate>(startOfMonth(min));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  // Only keyboard moves and opening pull focus into the grid; paging with
  // the arrow buttons leaves it on the button that was clicked.
  const focusDay = useRef(false);
  const valueId = useId();
  const dialogId = useId();

  const formats = useMemo(
    () => ({
      title: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
      value: new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      day: new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      weekdayShort: new Intl.DateTimeFormat(locale, { weekday: "short" }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
    }),
    [locale],
  );

  const selectable = useCallback((day: IsoDate) => day >= min && isOpenOn(day), [min]);

  /** The first day on or after `from` the studio would actually take. */
  const nextSelectable = useCallback(
    (from: IsoDate) => {
      let day = from < min ? min : from;
      for (let i = 0; i < 7 && !isOpenOn(day); i++) day = addDays(day, 1);
      return day;
    },
    [min],
  );

  useFormReset(rootRef, () => {
    setValue("");
    setOpen(false);
  });

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const dismiss = usePopoverDismiss(rootRef, open, close);

  useLayoutEffect(() => {
    if (!open || !focusDay.current) return;
    focusDay.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${active}"]`)?.focus();
  }, [open, active]);

  function openPicker() {
    const start = value !== "" && value >= min ? value : nextSelectable(min);
    setActive(start);
    setMonth(startOfMonth(start));
    focusDay.current = true;
    setOpen(true);
  }

  function commit(next: IsoDate) {
    setValue(next);
    onChange?.();
  }

  function moveTo(day: IsoDate) {
    const clamped = day < min ? min : day;
    setActive(clamped);
    setMonth(startOfMonth(clamped));
    focusDay.current = true;
  }

  function onGridKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const weekday = (parseIsoDate(active)!.getDay() + 6) % 7;
    const moves: Record<string, () => IsoDate> = {
      ArrowLeft: () => addDays(active, -1),
      ArrowRight: () => addDays(active, 1),
      ArrowUp: () => addDays(active, -7),
      ArrowDown: () => addDays(active, 7),
      Home: () => addDays(active, -weekday),
      End: () => addDays(active, 6 - weekday),
      PageUp: () => addMonths(active, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(active, event.shiftKey ? 12 : 1),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      moveTo(move());
    }
  }

  const minMonth = startOfMonth(min);
  const weeks = monthGrid(month);
  const today = min;

  return (
    <div ref={rootRef} className="relative" {...dismiss}>
      <input type="hidden" name={name} value={value} />
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? close(false) : openPicker())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            openPicker();
          }
        }}
        className="field field-picker aria-expanded:border-brand-400"
      >
        <span id={valueId} className={value === "" ? "text-ink-500" : undefined}>
          {value === ""
            ? t("consultation.datePlaceholder")
            : formats.value.format(parseIsoDate(value)!)}
        </span>
        <CalendarIcon className="h-5 w-5 shrink-0 text-ink-500" />
      </button>

      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-label={t("consultation.date")}
          tabIndex={-1}
          className={POPOVER_CLASS}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, -1))}
              disabled={month <= minMonth}
              aria-label={t("consultation.datePrevMonth")}
              className="date-nav"
            >
              <ChevronLeftIcon />
            </button>
            <p aria-live="polite" className="text-[0.95rem] font-semibold text-ink-900">
              {capitalize(formats.title.format(parseIsoDate(month)!), locale)}
            </p>
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label={t("consultation.dateNextMonth")}
              className="date-nav"
            >
              <ChevronRightIcon />
            </button>
          </div>

          <table
            ref={gridRef}
            role="grid"
            aria-label={capitalize(formats.title.format(parseIsoDate(month)!), locale)}
            onKeyDown={onGridKeyDown}
            className="w-full table-fixed border-collapse"
          >
            <thead>
              <tr>
                {weeks[0].map((day) => {
                  const date = parseIsoDate(day)!;
                  return (
                    <th
                      key={day}
                      scope="col"
                      abbr={formats.weekdayLong.format(date)}
                      className="pb-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-ink-500"
                    >
                      {capitalize(formats.weekdayShort.format(date).replace(".", ""), locale)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week[0]}>
                  {week.map((day) => {
                    if (startOfMonth(day) !== month) return <td key={day} role="gridcell" />;
                    const enabled = selectable(day);
                    const selected = day === value;
                    return (
                      <td key={day} role="gridcell" aria-selected={selected} className="p-0.5">
                        <button
                          type="button"
                          data-date={day}
                          tabIndex={day === active ? 0 : -1}
                          aria-disabled={!enabled || undefined}
                          aria-current={day === today ? "date" : undefined}
                          aria-label={formats.day.format(parseIsoDate(day)!)}
                          onClick={() => {
                            if (!enabled) return;
                            commit(day);
                            close(true);
                          }}
                          onKeyDown={(event) => {
                            if ((event.key === "Enter" || event.key === " ") && !enabled) {
                              event.preventDefault();
                            }
                          }}
                          onFocus={() => setActive(day)}
                          className="date-day"
                          data-selected={selected || undefined}
                          data-today={day === today || undefined}
                        >
                          {Number(day.slice(8))}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-brand-100 pt-3 text-xs">
            <span className="text-ink-500">{t("consultation.dateClosedDays")}</span>
            {value !== "" && (
              <button
                type="button"
                onClick={() => {
                  commit("");
                  close(true);
                }}
                className="font-semibold text-brand-600 hover:text-brand-800"
              >
                {t("consultation.dateClear")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
