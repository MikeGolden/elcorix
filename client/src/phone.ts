/**
 * Phone-number check for the consultation request (form + API).
 *
 * Deliberately loose about formatting — visitors write "+49 155 625 14 872",
 * "0155/6251487" or "(0049) 155 625-14-872" — but strict about content: only
 * digits and the punctuation people actually use, and a plausible number of
 * digits (7 to 15, the E.164 maximum). "asdf" or "12" no longer pass.
 *
 * The server repeats this check; keep the two in sync
 * (`server/src/phone.ts`).
 */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.length > 50) return false;
  if (!/^\+?[\d\s()./-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
