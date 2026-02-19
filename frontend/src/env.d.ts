/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DIRECTUS_URL: string;
  readonly PUBLIC_DIRECTUS_URL: string;
  readonly DIRECTUS_ADMIN_TOKEN: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY: string;
  readonly TURNSTILE_SECRET_KEY: string;
  readonly IBAN: string;
  readonly RESEND_API_KEY: string;
  readonly EMAIL_FROM: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user: import("./lib/types").DirectusUser | null;
    token: string | null;
  }
}
