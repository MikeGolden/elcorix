import { KeyboardEvent, useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { staticBusiness } from "../business";
import { ClockIcon } from "./icons";
import { POPOVER_CLASS, useFinePointer, useFormReset, usePopoverDismiss } from "./pickerPopover";

type Props = {
  id: string;
  name: string;
  /** "09:00", "09:30", … — the slots on offer, in order. */
  slots: readonly string[];
  /** The visible <label>'s id, so the trigger announces label + value. */
  labelId: string;
};

/**
 * The consultation form's time field. Same split as the date field next to
 * it (DatePicker.tsx): a native <select> where the pointer is a finger —
 * the OS wheel is the right picker there — and a popover in the calendar's
 * design where it is a mouse, so the two fields look like one pair instead
 * of a styled calendar next to macOS's grey menu.
 */
export default function TimeField(props: Props) {
  const { t } = useTranslation();
  const finePointer = useFinePointer();
  if (!finePointer) {
    return (
      <select id={props.id} name={props.name} defaultValue="" className="field field-select">
        <option value="">{t("consultation.timeAny")}</option>
        {props.slots.map((slot) => (
          <option key={slot} value={slot}>
            {slot}
          </option>
        ))}
      </select>
    );
  }
  return <TimePicker {...props} />;
}

/** Slots per row; two hours at half-hour steps. */
const COLUMNS = 4;

function TimePicker({ id, name, slots, labelId }: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  // The option that holds keyboard focus inside the list (roving tabindex).
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const focusOption = useRef(false);
  const valueId = useId();
  const dialogId = useId();

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
    if (!open || !focusOption.current) return;
    focusOption.current = false;
    listRef.current?.querySelector<HTMLButtonElement>(`[data-index="${active}"]`)?.focus();
  }, [open, active]);

  function openPicker() {
    setActive(Math.max(0, slots.indexOf(value)));
    focusOption.current = true;
    setOpen(true);
  }

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = slots.length - 1;
    const moves: Record<string, () => number> = {
      ArrowLeft: () => active - 1,
      ArrowRight: () => active + 1,
      ArrowUp: () => active - COLUMNS,
      ArrowDown: () => active + COLUMNS,
      Home: () => 0,
      End: () => last,
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const next = Math.min(last, Math.max(0, move()));
    setActive(next);
    focusOption.current = true;
  }

  const hours = staticBusiness.openingHours[0];

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
        onClick={() => (open ? close(false) : openPicker())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            openPicker();
          }
        }}
        className="field field-picker aria-expanded:border-brand-400"
      >
        <span id={valueId} className={value === "" ? "text-ink-500" : "tabular-nums"}>
          {value === "" ? t("consultation.timeAny") : value}
        </span>
        <ClockIcon className="h-5 w-5 shrink-0 text-ink-500" />
      </button>

      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-label={t("consultation.time")}
          tabIndex={-1}
          className={POPOVER_CLASS}
        >
          <div
            ref={listRef}
            role="listbox"
            aria-label={t("consultation.time")}
            onKeyDown={onListKeyDown}
            className="grid grid-cols-4 gap-1"
          >
            {slots.map((slot, index) => (
              <button
                key={slot}
                type="button"
                role="option"
                data-index={index}
                aria-selected={slot === value}
                tabIndex={index === active ? 0 : -1}
                onFocus={() => setActive(index)}
                onClick={() => {
                  setValue(slot);
                  close(true);
                }}
                className="time-slot"
              >
                {slot}
              </button>
            ))}
          </div>

          {/* The calendar's footer: a hint on the left, the way back to
              "no preference" on the right once a slot is chosen. */}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-brand-100 pt-3 text-xs">
            <span className="text-ink-500">
              {t("consultation.timeHours", { opens: hours.opens, closes: hours.closes })}
            </span>
            {value !== "" && (
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  close(true);
                }}
                className="font-semibold text-brand-600 hover:text-brand-800"
              >
                {t("consultation.timeAny")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
