/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALTEGIO_COMPANY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
