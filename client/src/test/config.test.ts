import { altegioLinks, parseAltegioService } from "../business";
import { featuresFrom } from "../features";

describe("config", () => {
  it("only ever frames the studio's own alteg.io pages", () => {
    // These URLs become an iframe src that can front a payment flow.
    for (const url of Object.values(altegioLinks)) {
      expect(new URL(url).protocol).toBe("https:");
      expect(new URL(url).host).toBe("n1463826.alteg.io");
    }
  });

  it("takes only a known service from ?service=, never a URL or a prototype key", () => {
    expect(parseAltegioService("beardContour")).toBe("beardContour");
    for (const raw of [null, "", "toString", "__proto__", "https://evil.example", "general "]) {
      expect(parseAltegioService(raw), String(raw)).toBe("general");
    }
  });

  it("has the Altegio integration on unless a build turns it off explicitly", () => {
    expect(featuresFrom({}).altegio).toBe(true);
    expect(featuresFrom({ VITE_ENABLE_ALTEGIO: "true" }).altegio).toBe(true);
    expect(featuresFrom({ VITE_ENABLE_ALTEGIO: "false" }).altegio).toBe(false);
  });
});
