/**
 * Build-time feature flags.
 *
 * Env-free on purpose, exactly like `business.ts`: `vite/seoPrerender.ts`
 * imports this from the Vite config context, where `import.meta.env` does
 * not exist. The env-derived value lives in `config.ts`.
 *
 * `altegio` — the online-booking integration (the `<AltegioWidget>` embed,
 * the `#booking` landing section and the `/booking` route). Off by default
 * since 2026-09-09: the studio is not taking bookings through Altegio yet,
 * so the block is hidden rather than removed. Everything it needs is still
 * in the tree; set `VITE_ENABLE_ALTEGIO=true` at build time to bring the
 * section, the route, its sitemap entries and its prerendered shells back.
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
 * Anything but the exact string "true" leaves `altegio` off.
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
    altegio: env.VITE_ENABLE_ALTEGIO === "true",
    analytics: isUmamiWebsiteId(env.VITE_UMAMI_WEBSITE_ID),
  };
}
