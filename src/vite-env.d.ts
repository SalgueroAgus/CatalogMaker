/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETLIFY_PAT?: string;
  readonly VITE_NETLIFY_SITE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
