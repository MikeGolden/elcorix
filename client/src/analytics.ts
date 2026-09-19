import { isUmamiWebsiteId } from "./features";

/**
 * Self-hosted Umami analytics (docker-compose.yml → umami).
 *
 * Cookie-free: the tracker stores nothing on the device, and Umami keeps no
 * IP addresses — visits are grouped by a hash that changes daily
 * (SALT_ROTATION=day). The privacy policy section tagged
 * `"feature": "analytics"` describes exactly this; change both together.
 *
 * The script is served first-party: nginx maps TRACKER_PATH to Umami's
 * /script.js, and the tracker posts to the sibling /u/api/send, which nginx
 * maps to Umami's collect endpoint (docker/nginx.conf). Keep the path in
 * step with the two nginx locations.
 */
export const TRACKER_PATH = "/u/p.js";

/**
 * Every custom event the site sends. Event data never carries anything a
 * visitor typed — only where on the page the click happened.
 */
export type AnalyticsEvent =
  | "phone-click"
  | "email-click"
  | "whatsapp-click"
  | "instagram-click"
  | "consultation-request"
  | "contact-message"
  | "booking-consent";

export type AnalyticsData = Record<string, string | number>;

export type AnalyticsConfig = {
  websiteId: string;
  /** Hostnames the tracker counts on; empty = everywhere (dev, tests). */
  domains: string[];
};

type UmamiTracker = {
  track: (event: string, data?: AnalyticsData) => unknown;
};

export function analyticsConfigFrom(env: {
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  readonly VITE_UMAMI_DOMAINS?: string;
}): AnalyticsConfig | null {
  const websiteId = env.VITE_UMAMI_WEBSITE_ID;
  if (!isUmamiWebsiteId(websiteId)) return null;
  const domains = (env.VITE_UMAMI_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  return { websiteId: websiteId.trim(), domains };
}

/** Adds the Umami script to <head> once. */
export function injectTracker(config: AnalyticsConfig, doc: Document = document): void {
  if (doc.querySelector(`script[src="${TRACKER_PATH}"]`)) return;
  const script = doc.createElement("script");
  script.src = TRACKER_PATH;
  script.defer = true;
  script.dataset.websiteId = config.websiteId;
  // Belt and braces: initAnalytics already skips opted-out browsers, and
  // the tracker re-checks Do Not Track itself.
  script.dataset.doNotTrack = "true";
  // In-page anchors (#contact, #prices) are not pages.
  script.dataset.excludeHash = "true";
  if (config.domains.length > 0) script.dataset.domains = config.domains.join(",");
  doc.head.appendChild(script);
}

/**
 * Sends a custom event. A no-op until the tracker has loaded, when it is
 * blocked, or when analytics is not built in — and it never throws: a
 * broken tracker must not break a form submission.
 */
export function track(event: AnalyticsEvent, data?: AnalyticsData): void {
  const umami = (window as { umami?: UmamiTracker }).umami;
  if (typeof umami?.track !== "function") return;
  try {
    void Promise.resolve(umami.track(event, data)).catch(() => undefined);
  } catch {
    // Analytics is best-effort by design.
  }
}

/** The contact channel a link opens, or null for an ordinary link. */
export function linkEventFor(href: string): AnalyticsEvent | null {
  const value = href.trim().toLowerCase();
  if (value.startsWith("tel:")) return "phone-click";
  if (value.startsWith("mailto:")) return "email-click";
  let hostname: string;
  try {
    hostname = new URL(value).hostname;
  } catch {
    return null;
  }
  const is = (domain: string) => hostname === domain || hostname.endsWith(`.${domain}`);
  if (is("wa.me") || is("whatsapp.com")) return "whatsapp-click";
  if (is("instagram.com")) return "instagram-click";
  return null;
}

/**
 * Where on the page a link sits — "header", "footer", or the id of the
 * landing section ("contact", "hero", …). Lets the dashboard compare the
 * WhatsApp button in the header with the one in the contact section.
 */
export function placementOf(element: Element): string {
  const region = element.closest("header, footer, section[id]");
  if (!region) return "page";
  return region.tagName === "SECTION" ? region.id : region.tagName.toLowerCase();
}

/**
 * One delegated listener for every phone, e-mail, WhatsApp and Instagram
 * link on the site, present and future — no component has to remember to
 * tag its links. Returns the cleanup function.
 */
export function installLinkTracking(doc: Document = document): () => void {
  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (!link) return;
    const name = linkEventFor(link.getAttribute("href") ?? "");
    if (name) track(name, { placement: placementOf(link) });
  };
  // Capture phase: runs before any handler that stops propagation.
  doc.addEventListener("click", onClick, true);
  return () => doc.removeEventListener("click", onClick, true);
}

type PrivacySignals = {
  globalPrivacyControl?: boolean;
  doNotTrack?: string | null;
};

/**
 * The visitor's browser asks not to be tracked: Global Privacy Control
 * (Firefox, Brave, extensions) or the older Do Not Track. The privacy
 * policy promises that either one keeps the tracker from loading at all.
 */
export function optedOut(
  nav: PrivacySignals = navigator as PrivacySignals,
  win: { doNotTrack?: string | null } = window as { doNotTrack?: string | null },
): boolean {
  return (
    nav.globalPrivacyControl === true ||
    nav.doNotTrack === "1" ||
    nav.doNotTrack === "yes" ||
    win.doNotTrack === "1"
  );
}

/**
 * Wires up the tracker and link tracking when the build has a website id
 * and the browser sends no opt-out signal. Returns whether it did.
 */
export function initAnalytics(
  env: Parameters<typeof analyticsConfigFrom>[0],
  doc: Document = document,
  signals: { nav?: PrivacySignals; win?: { doNotTrack?: string | null } } = {},
): boolean {
  const config = analyticsConfigFrom(env);
  if (!config || optedOut(signals.nav, signals.win)) return false;
  injectTracker(config, doc);
  installLinkTracking(doc);
  return true;
}
