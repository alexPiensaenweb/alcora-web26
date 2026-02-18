/**
 * Auth helpers - Cookie management for httpOnly sessions
 */

import type { AstroCookies } from "astro";
import type { AuthTokens, DirectusUser } from "./types";
import { getDirectusUrl } from "./directus";

const COOKIE_SESSION = "alcora_session";
const COOKIE_REFRESH = "alcora_refresh";

const IS_PRODUCTION =
  (process.env.NODE_ENV === "production") ||
  (process.env.REDSYS_ENV === "production") ||
  (process.env.PUBLIC_SITE_URL || "").startsWith("https");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(
  cookies: AstroCookies,
  tokens: AuthTokens
): void {
  cookies.set(COOKIE_SESSION, tokens.access_token, {
    ...COOKIE_OPTIONS,
    maxAge: tokens.expires / 1000, // expires is in ms
  });
  cookies.set(COOKIE_REFRESH, tokens.refresh_token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookies(cookies: AstroCookies): void {
  // Set cookies to empty with immediate expiry to ensure deletion
  cookies.set(COOKIE_SESSION, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  cookies.set(COOKIE_REFRESH, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  cookies.delete(COOKIE_SESSION, { path: "/" });
  cookies.delete(COOKIE_REFRESH, { path: "/" });
}

export function getSessionToken(cookies: AstroCookies): string | null {
  return cookies.get(COOKIE_SESSION)?.value || null;
}

export function getRefreshToken(cookies: AstroCookies): string | null {
  return cookies.get(COOKIE_REFRESH)?.value || null;
}

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<AuthTokens> {
  const res = await fetch(`${getDirectusUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error?.errors?.[0]?.message || "Credenciales invalidas"
    );
  }

  const { data } = await res.json();
  return data;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<AuthTokens | null> {
  try {
    const res = await fetch(`${getDirectusUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: refreshToken,
        mode: "json",
      }),
    });

    if (!res.ok) return null;

    const { data } = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function getCurrentUser(
  token: string
): Promise<DirectusUser | null> {
  try {
    const res = await fetch(`${getDirectusUrl()}/users/me?fields=id,email,first_name,last_name,status,role,grupo_cliente,razon_social,cif_nif,telefono,direccion_facturacion,direccion_envio`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const { data } = await res.json();
    return data;
  } catch {
    return null;
  }
}
