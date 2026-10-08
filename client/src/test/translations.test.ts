import en from "../i18n/locales/en/common.json";
import de from "../i18n/locales/de/common.json";
import uk from "../i18n/locales/uk/common.json";
import ru from "../i18n/locales/ru/common.json";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) =>
      flattenKeys(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

function flattenEntries(value: unknown, prefix = ""): Array<[string, unknown]> {
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) =>
      flattenEntries(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [[prefix, value]];
}

/**
 * i18next plural forms differ by language — English has `_one`/`_other`,
 * Ukrainian and Russian add `_few`/`_many` — so a plural key counts once,
 * under its base name, when comparing key sets.
 */
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

function comparableKeys(resources: unknown): string[] {
  return [...new Set(flattenKeys(resources).map((key) => key.replace(PLURAL_SUFFIX, "")))].sort();
}

describe("translation completeness", () => {
  const enKeys = comparableKeys(en);

  it.each([
    ["de", de],
    ["uk", uk],
    ["ru", ru],
  ] as const)("%s contains exactly the same key set as en", (_language, resources) => {
    expect(comparableKeys(resources)).toEqual(enKeys);
  });

  it.each([
    ["uk", uk],
    ["ru", ru],
  ] as const)("%s has every plural form its language needs", (_language, resources) => {
    const keys = flattenKeys(resources);
    for (const base of new Set(keys.filter((k) => PLURAL_SUFFIX.test(k)).map((k) => k.replace(PLURAL_SUFFIX, "")))) {
      for (const form of ["one", "few", "many", "other"]) {
        expect(keys, base).toContain(`${base}_${form}`);
      }
    }
  });

  it.each([
    ["en", en],
    ["de", de],
    ["uk", uk],
    ["ru", ru],
  ] as const)("%s has no empty translations", (_language, resources) => {
    for (const [key, value] of flattenEntries(resources)) {
      expect(typeof value, key).toBe("string");
      expect((value as string).trim(), key).not.toBe("");
    }
  });
});
