/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALTEGIO_COMPANY_ID?: string;
  /** "true" re-enables the Altegio booking integration — see src/features.ts. */
  readonly VITE_ENABLE_ALTEGIO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
