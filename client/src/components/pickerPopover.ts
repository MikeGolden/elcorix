import { FocusEvent, KeyboardEvent, RefObject, useEffect, useState } from "react";

/**
 * Shared plumbing for the consultation form's desktop pickers
 * (DatePicker.tsx, TimePicker.tsx): when to show them, how their popover
 * closes, and the popover's look.
 */

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/**
 * Whether the primary pointer is a mouse. Always `false` on the first
 * render — the server has no pointer to ask — so hydration stays exact and
 * the native control is what a visitor without JavaScript gets.
 */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(FINE_POINTER);
    setFine(query.matches);
    const update = (event: MediaQueryListEvent) => setFine(event.matches);
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return fine;
}

/** form.reset() only resets real form controls; a picker's value is state. */
export function useFormReset(rootRef: RefObject<HTMLElement | null>, onReset: () => void) {
  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
    // onReset only ever sets state, so the first one is as good as any.
  }, []);
}

/**
 * Closing rules for a popover rendered inside `rootRef`: a press anywhere
 * outside it, Escape, or tabbing out of it.
 *
 * Tabbing out is detected on blur, and only when focus demonstrably went
 * somewhere else (`relatedTarget` outside the root). A `null` relatedTarget
 * does NOT close: Safari on macOS never focuses a <button> on click, so a
 * click on the popover's own month arrows used to blur the focused day with
 * nowhere to go, close the popover on mousedown and swallow the click. Chrome
 * did the same for a click on any plain text inside the popover. Clicks
 * outside are the pointerdown listener's job, not blur's.
 */
export function usePopoverDismiss(
  rootRef: RefObject<HTMLElement | null>,
  open: boolean,
  close: (returnFocus: boolean) => void,
) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close, rootRef]);

  return {
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        close(true);
      }
    },
    onBlur(event: FocusEvent<HTMLElement>) {
      const next = event.relatedTarget as Node | null;
      if (open && next !== null && !rootRef.current?.contains(next)) close(false);
    },
  };
}

/**
 * The popover panel both pickers share. `tabIndex={-1}` goes with it: a
 * focusable panel gives Safari's click-focus somewhere inside to land, so
 * Escape and the arrow keys keep working after a click on its arrows.
 */
export const POPOVER_CLASS =
  "picker-popover absolute left-0 top-full z-30 mt-2 w-[21rem] max-w-[calc(100vw-3rem)] rounded-panel bg-white p-4 shadow-[0_18px_50px_-12px_rgba(20,32,63,0.28)] ring-1 ring-brand-100 focus:outline-none";
