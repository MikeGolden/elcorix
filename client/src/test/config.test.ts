import { altegioBookingUrl, business } from "../config";

describe("config", () => {
  it("always produces a numeric-id alteg.io booking URL", () => {
    // The company id is interpolated into the URL that will front the
    // payment flow — it must never contain anything but digits.
    expect(business.altegioCompanyId).toMatch(/^\d{1,12}$/);
    expect(altegioBookingUrl).toMatch(/^https:\/\/n\d{1,12}\.alteg\.io$/);
  });
});
