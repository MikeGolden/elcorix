/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALTEGIO_COMPANY_ID?: string;
  /** "true" re-enables the Altegio booking integration — see src/features.ts. */
  readonly VITE_ENABLE_ALTEGIO?: string;
  /** Umami website id — enables the tracker, see src/analytics.ts. */
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  /** Comma-separated hostnames the tracker counts on. */
  readonly VITE_UMAMI_DOMAINS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
