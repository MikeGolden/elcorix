import {
  TRACKER_PATH,
  analyticsConfigFrom,
  initAnalytics,
  injectTracker,
  installLinkTracking,
  linkEventFor,
  optedOut,
  placementOf,
  track,
} from "../analytics";
import { featuresFrom } from "../features";

const ID = "3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b";

type Win = { umami?: { track: (...args: unknown[]) => unknown } };

function stubUmami() {
  const track = vi.fn();
  (window as Win).umami = { track };
  return track;
}

afterEach(() => {
  delete (window as Win).umami;
  document.head.querySelectorAll(`script[src="${TRACKER_PATH}"]`).forEach((s) => s.remove());
  document.body.innerHTML = "";
});

describe("analytics config", () => {
  it("is off without a website id, or with anything that is not a UUID", () => {
    expect(analyticsConfigFrom({})).toBeNull();
    expect(analyticsConfigFrom({ VITE_UMAMI_WEBSITE_ID: "" })).toBeNull();
    expect(analyticsConfigFrom({ VITE_UMAMI_WEBSITE_ID: "your-website-id" })).toBeNull();
    expect(featuresFrom({}).analytics).toBe(false);
    expect(featuresFrom({ VITE_UMAMI_WEBSITE_ID: "nope" }).analytics).toBe(false);
  });

  it("reads the id and normalises the domain list", () => {
    expect(
      analyticsConfigFrom({
        VITE_UMAMI_WEBSITE_ID: ` ${ID} `,
        VITE_UMAMI_DOMAINS: " Elcorix.com, elcorix.de ,,elcorix.eu",
      }),
    ).toEqual({ websiteId: ID, domains: ["elcorix.com", "elcorix.de", "elcorix.eu"] });
    expect(featuresFrom({ VITE_UMAMI_WEBSITE_ID: ID }).analytics).toBe(true);
  });
});

describe("injectTracker", () => {
  it("adds one first-party, privacy-configured script", () => {
    const config = { websiteId: ID, domains: ["elcorix.com", "elcorix.de"] };
    injectTracker(config);
    injectTracker(config);
    const scripts = document.head.querySelectorAll<HTMLScriptElement>(
      `script[src="${TRACKER_PATH}"]`,
    );
    expect(scripts).toHaveLength(1);
    const script = scripts[0]!;
    // Same origin: no CSP change, no third-party host.
    expect(script.getAttribute("src")).toBe("/u/p.js");
    expect(script.defer).toBe(true);
    expect(script.dataset.websiteId).toBe(ID);
    expect(script.dataset.domains).toBe("elcorix.com,elcorix.de");
    expect(script.dataset.doNotTrack).toBe("true");
    expect(script.dataset.excludeHash).toBe("true");
    // UTM parameters are the point of marketing analytics — keep the query.
    expect(script.dataset.excludeSearch).toBeUndefined();
  });

  it("omits data-domains when no domains are configured", () => {
    injectTracker({ websiteId: ID, domains: [] });
    const script = document.head.querySelector<HTMLScriptElement>(
      `script[src="${TRACKER_PATH}"]`,
    )!;
    expect(script.hasAttribute("data-domains")).toBe(false);
  });
});

describe("opt-out signals", () => {
  it("honours Global Privacy Control and Do Not Track", () => {
    expect(optedOut({}, {})).toBe(false);
    expect(optedOut({ globalPrivacyControl: true }, {})).toBe(true);
    expect(optedOut({ doNotTrack: "1" }, {})).toBe(true);
    expect(optedOut({ doNotTrack: "yes" }, {})).toBe(true);
    expect(optedOut({ doNotTrack: "0" }, {})).toBe(false);
    expect(optedOut({ doNotTrack: "unspecified" }, {})).toBe(false);
    expect(optedOut({}, { doNotTrack: "1" })).toBe(true);
  });

  it("initAnalytics loads nothing for an opted-out browser", () => {
    const loaded = initAnalytics({ VITE_UMAMI_WEBSITE_ID: ID }, document, {
      nav: { globalPrivacyControl: true },
      win: {},
    });
    expect(loaded).toBe(false);
    expect(document.head.querySelector(`script[src="${TRACKER_PATH}"]`)).toBeNull();
  });

  it("initAnalytics loads nothing without a website id", () => {
    expect(initAnalytics({}, document, { nav: {}, win: {} })).toBe(false);
    expect(document.head.querySelector(`script[src="${TRACKER_PATH}"]`)).toBeNull();
  });
});

describe("track", () => {
  it("is a silent no-op before the tracker has loaded", () => {
    expect(() => track("contact-message")).not.toThrow();
  });

  it("forwards the event to Umami", () => {
    const umamiTrack = stubUmami();
    track("consultation-request", { preferredDate: "yes" });
    expect(umamiTrack).toHaveBeenCalledWith("consultation-request", { preferredDate: "yes" });
  });

  it("never lets a broken tracker break the caller", async () => {
    (window as Win).umami = {
      track: () => {
        throw new Error("boom");
      },
    };
    expect(() => track("contact-message")).not.toThrow();
    (window as Win).umami = { track: () => Promise.reject(new Error("offline")) };
    expect(() => track("contact-message")).not.toThrow();
    // Let the rejected promise settle — an unhandled rejection would fail the run.
    await Promise.resolve();
  });
});

describe("link tracking", () => {
  it.each([
    ["tel:+4915562514872", "phone-click"],
    ["mailto:info@elcorix.de", "email-click"],
    ["https://wa.me/4915562514872", "whatsapp-click"],
    ["https://api.whatsapp.com/send?phone=49", "whatsapp-click"],
    ["https://instagram.com/elcorix", "instagram-click"],
    ["https://www.instagram.com/elcorix/", "instagram-click"],
    ["/de/prices", null],
    ["#contact", null],
    ["https://www.openstreetmap.org/", null],
    ["https://notinstagram.com/", null],
    ["https://instagram.com.evil.example/", null],
  ] as const)("%s → %s", (href, expected) => {
    expect(linkEventFor(href)).toBe(expected);
  });

  it("names the page region a link sits in", () => {
    document.body.innerHTML = `
      <header><a id="a" href="#">x</a></header>
      <main><section id="contact"><div><a id="b" href="#">x</a></div></section>
      <p><a id="c" href="#">x</a></p></main>
      <footer><a id="d" href="#">x</a></footer>`;
    const at = (id: string) => placementOf(document.getElementById(id)!);
    expect(at("a")).toBe("header");
    expect(at("b")).toBe("contact");
    expect(at("c")).toBe("page");
    expect(at("d")).toBe("footer");
  });

  it("reports contact-channel clicks with their placement, and nothing else", () => {
    const umamiTrack = stubUmami();
    document.body.innerHTML = `
      <section id="contact">
        <a id="wa" href="https://wa.me/4915562514872" target="_blank"><span id="icon">WA</span></a>
        <a id="tel" href="tel:+4915562514872">call</a>
        <a id="prices" href="/de/prices">prices</a>
      </section>`;
    const stop = installLinkTracking();
    // Links must not navigate the jsdom window.
    document.addEventListener("click", (event) => event.preventDefault());

    // A click on an element INSIDE the link counts for the link.
    document.getElementById("icon")!.click();
    document.getElementById("tel")!.click();
    document.getElementById("prices")!.click();
    expect(umamiTrack.mock.calls).toEqual([
      ["whatsapp-click", { placement: "contact" }],
      ["phone-click", { placement: "contact" }],
    ]);

    stop();
    document.getElementById("tel")!.click();
    expect(umamiTrack).toHaveBeenCalledTimes(2);
  });
});
