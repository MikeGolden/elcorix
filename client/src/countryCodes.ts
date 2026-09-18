/**
 * Dial codes for the consultation form's phone field.
 *
 * Füssen is a border town with a seasonal, multilingual clientele, so the
 * list is not "every country on earth" but the ones the studio actually
 * hears from: the German-speaking neighbours first, then the rest in
 * alphabetical order by ISO code.
 *
 * `value` is the ISO code, not the dial code: +1 and +7 are each shared by
 * several countries, and a <select> needs unique option values.
 */
export type Country = {
  /** ISO 3166-1 alpha-2 — the option value. */
  iso: string;
  /** E.164 country calling code, with the plus. */
  dial: string;
  /** Regional-indicator pair; renders as a flag, or as "DE" where it doesn't. */
  flag: string;
  /**
   * Italy keeps the leading zero of the national number ("+39 06 …");
   * everyone else in this list drops it as a trunk prefix.
   */
  keepTrunkZero?: boolean;
};

export const COUNTRIES: Country[] = [
  { iso: "DE", dial: "+49", flag: "🇩🇪" },
  { iso: "AT", dial: "+43", flag: "🇦🇹" },
  { iso: "CH", dial: "+41", flag: "🇨🇭" },
  { iso: "BE", dial: "+32", flag: "🇧🇪" },
  { iso: "BG", dial: "+359", flag: "🇧🇬" },
  { iso: "CZ", dial: "+420", flag: "🇨🇿" },
  { iso: "DK", dial: "+45", flag: "🇩🇰" },
  { iso: "EE", dial: "+372", flag: "🇪🇪" },
  { iso: "ES", dial: "+34", flag: "🇪🇸" },
  { iso: "FI", dial: "+358", flag: "🇫🇮" },
  { iso: "FR", dial: "+33", flag: "🇫🇷" },
  { iso: "GB", dial: "+44", flag: "🇬🇧" },
  { iso: "GR", dial: "+30", flag: "🇬🇷" },
  { iso: "HR", dial: "+385", flag: "🇭🇷" },
  { iso: "HU", dial: "+36", flag: "🇭🇺" },
  { iso: "IE", dial: "+353", flag: "🇮🇪" },
  { iso: "IT", dial: "+39", flag: "🇮🇹", keepTrunkZero: true },
  { iso: "KZ", dial: "+7", flag: "🇰🇿" },
  { iso: "LT", dial: "+370", flag: "🇱🇹" },
  { iso: "LV", dial: "+371", flag: "🇱🇻" },
  { iso: "MD", dial: "+373", flag: "🇲🇩" },
  { iso: "NL", dial: "+31", flag: "🇳🇱" },
  { iso: "NO", dial: "+47", flag: "🇳🇴" },
  { iso: "PL", dial: "+48", flag: "🇵🇱" },
  { iso: "PT", dial: "+351", flag: "🇵🇹" },
  { iso: "RO", dial: "+40", flag: "🇷🇴" },
  { iso: "RS", dial: "+381", flag: "🇷🇸" },
  { iso: "SE", dial: "+46", flag: "🇸🇪" },
  { iso: "SI", dial: "+386", flag: "🇸🇮" },
  { iso: "SK", dial: "+421", flag: "🇸🇰" },
  { iso: "TR", dial: "+90", flag: "🇹🇷" },
  { iso: "UA", dial: "+380", flag: "🇺🇦" },
  { iso: "US", dial: "+1", flag: "🇺🇸" },
];

/** Germany: the studio is in Füssen and most callers are local. */
export const DEFAULT_COUNTRY = "DE";

export function countryByIso(iso: string): Country {
  return COUNTRIES.find((c) => c.iso === iso) ?? COUNTRIES[0];
}

/** "🇩🇪 +49" — short enough to stay readable in the closed select. */
export function countryLabel(country: Country): string {
  return `${country.flag} ${country.dial}`;
}

/**
 * Does the visitor's input already carry a country code? People paste
 * "+49 155 …" or "0049 155 …" into the national field out of habit; rather
 * than letting that become "+49 +49 155 …" at submit time, we move the
 * prefix into the select.
 *
 * Returns null when there is no international prefix, or when the prefix
 * belongs to a country the list does not offer — better to leave what the
 * visitor typed alone than to guess.
 */
export function splitInternational(
  value: string,
): { iso: string; national: string } | null {
  const trimmed = value.trim();
  const normalised = trimmed.startsWith("00") ? `+${trimmed.slice(2)}` : trimmed;
  if (!normalised.startsWith("+")) return null;
  // Compare on digits only: "+49 (155)" and "+49155" are the same prefix.
  const digits = normalised.replace(/\D/g, "");
  // Longest dial code first, so +380 wins over a hypothetical +38.
  const match = [...COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => digits.startsWith(c.dial.slice(1)));
  if (!match) return null;
  const rest = digits.slice(match.dial.length - 1);
  if (rest === "") return null;
  return { iso: match.iso, national: rest };
}

/**
 * The value that leaves the form: dial code + national number, with the
 * trunk zero dropped ("0155 …" dialled from abroad is "+49 155 …").
 */
export function composePhone(iso: string, national: string): string {
  const country = countryByIso(iso);
  let rest = national.trim();
  if (!country.keepTrunkZero) rest = rest.replace(/^0+(?=\d)/, "");
  if (rest === "") return "";
  return `${country.dial} ${rest}`;
}
