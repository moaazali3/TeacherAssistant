/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_TENANT_MODE: 'subdomain' | 'path';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
