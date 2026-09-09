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

describe("translation completeness", () => {
  const enKeys = flattenKeys(en).sort();

  it.each([
    ["de", de],
    ["uk", uk],
    ["ru", ru],
  ] as const)("%s contains exactly the same key set as en", (_language, resources) => {
    expect(flattenKeys(resources).sort()).toEqual(enKeys);
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
