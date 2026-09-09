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
};

/** Anything but the exact string "true" leaves a flag off. */
export function featuresFrom(env: {
  readonly VITE_ENABLE_ALTEGIO?: string;
}): Features {
  return {
    altegio: env.VITE_ENABLE_ALTEGIO === "true",
  };
}
