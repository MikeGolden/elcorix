// Only non-translatable business data lives here; all user-visible copy
// is in src/i18n/locales/*/common.json.
//
// The static half sits in src/business.ts so the SEO prerender plugin can
// import it without an environment; this module adds everything that is
// derived from `import.meta.env` at build time.
import { staticBusiness } from "./business";
import { featuresFrom } from "./features";

export const business = staticBusiness;

/** Build-time feature flags — see src/features.ts. */
export const features = featuresFrom(import.meta.env);

/** `tel:` href without the spaces the display format carries. */
export const telHref = `tel:${business.phone.replace(/\s/g, "")}`;
