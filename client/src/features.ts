/**
 * Build-time feature flags.
 *
 * Env-free on purpose, exactly like `business.ts`: `vite/seoPrerender.ts`
 * imports this from the Vite config context, where `import.meta.env` does
 * not exist. The env-derived value lives in `config.ts`.
 *
 * `altegio` — the online-booking integration (the `<AltegioWidget>` embed,
 * the `#booking` landing section, the `/booking` route, the consent banner
 * and the privacy policy's Altegio section). On by default since
 * 2026-10-23, when the studio started taking bookings through Altegio;
 * `VITE_ENABLE_ALTEGIO=false` at build time hides all of it again, and the
 * booking buttons then fall back to new-tab links into Altegio.
 */
export type Features = {
  altegio: boolean;
  analytics: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Umami identifies a website by a UUID. Anything else — empty, a typo, a
 * leftover placeholder — counts as "not configured" rather than loading a
 * tracker that silently records nothing.
 */
export function isUmamiWebsiteId(value: string | undefined): value is string {
  return value !== undefined && UUID.test(value.trim());
}

/**
 * Only the exact string "false" turns `altegio` off.
 *
 * `analytics` — self-hosted Umami (see `analytics.ts`), on when
 * `VITE_UMAMI_WEBSITE_ID` holds a website id. The flag also shows the
 * privacy policy's analytics section, so the policy describes the tracker
 * exactly when the build contains it.
 */
export function featuresFrom(env: {
  readonly VITE_ENABLE_ALTEGIO?: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
}): Features {
  return {
    altegio: env.VITE_ENABLE_ALTEGIO !== "false",
    analytics: isUmamiWebsiteId(env.VITE_UMAMI_WEBSITE_ID),
  };
}
