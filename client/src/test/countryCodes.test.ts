import {
  COUNTRIES,
  composePhone,
  countryByIso,
  countryLabel,
  splitInternational,
} from "../countryCodes";

describe("countryCodes", () => {
  it("offers Germany first and keeps every option value unique", () => {
    expect(COUNTRIES[0].iso).toBe("DE");
    expect(COUNTRIES[0].dial).toBe("+49");
    expect(new Set(COUNTRIES.map((c) => c.iso)).size).toBe(COUNTRIES.length);
    expect(COUNTRIES.every((c) => /^\+\d{1,3}$/.test(c.dial))).toBe(true);
  });

  it("labels an option with its flag and dial code", () => {
    expect(countryLabel(countryByIso("UA"))).toBe("🇺🇦 +380");
  });

  it("drops the trunk zero when composing, except where it belongs", () => {
    expect(composePhone("DE", "0155 1234567")).toBe("+49 155 1234567");
    expect(composePhone("DE", "155 1234567")).toBe("+49 155 1234567");
    // Italian landlines keep theirs: "+39 06 …" is the real number.
    expect(composePhone("IT", "06 1234567")).toBe("+39 06 1234567");
    expect(composePhone("DE", "   ")).toBe("");
  });

  it("recognises a country code typed into the number field", () => {
    expect(splitInternational("+43 660 1234567")).toEqual({
      iso: "AT",
      national: "6601234567",
    });
    // "00" is the same prefix dialled the old way.
    expect(splitInternational("0049 155 1234567")).toEqual({
      iso: "DE",
      national: "1551234567",
    });
    // Longer codes win over shorter ones.
    expect(splitInternational("+380 50 1234567")?.iso).toBe("UA");
  });

  it("leaves the field alone when there is nothing to split off", () => {
    expect(splitInternational("155 1234567")).toBeNull();
    expect(splitInternational("0155 1234567")).toBeNull();
    // A code we do not offer: better untouched than guessed.
    expect(splitInternational("+998 90 1234567")).toBeNull();
    // The code on its own is not yet a number to split.
    expect(splitInternational("+49")).toBeNull();
  });
});
