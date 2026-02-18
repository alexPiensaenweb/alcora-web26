/**
 * Astro Middleware - Auth guard + user injection + security
 *
 * Runs on every SSR request:
 * 1. Reads session cookie
 * 2. Validates token with Directus
 * 3. Auto-refreshes if expired
 * 4. Injects user into Astro.locals
 * 5. Protects specific routes
 * 6. Adds security headers
 * 7. CSRF protection on state-changing requests
 */

import { defineMiddleware } from "astro:middleware";
import {
  getSessionToken,
  getRefreshToken,
  getCurrentUser,
  refreshAccessToken,
  setAuthCookies,
  clearAuthCookies,
} from "./lib/auth";

const PROTECTED_ROUTES = ["/cuenta", "/checkout"];
const LOGIN_ROUTE = "/login";

const IS_PRODUCTION =
  (process.env.NODE_ENV === "production") ||
  (process.env.REDSYS_ENV === "production") ||
  (process.env.PUBLIC_SITE_URL || "").startsWith("https");

const PUBLIC_DIRECTUS_URL =
  process.env.PUBLIC_DIRECTUS_URL || import.meta.env.PUBLIC_DIRECTUS_URL || "";

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect } = context;
  const pathname = url.pathname;

  // Default: no user
  context.locals.user = null;
  context.locals.token = null;

  // ─── CSRF Protection: verify Origin on state-changing requests ───
  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    const origin = context.request.headers.get("origin");
    const host = context.request.headers.get("host");

    // Allow Redsys webhook (server-to-server, no Origin header)
    const isWebhook = pathname.startsWith("/api/webhooks/");

    if (!isWebhook && origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new Response(
            JSON.stringify({ error: "Solicitud no autorizada" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "Solicitud no autorizada" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
  }

  // ─── Authentication ───
  let token = getSessionToken(cookies);

  if (token) {
    const user = await getCurrentUser(token);
    if (user) {
      context.locals.user = user;
      context.locals.token = token;
    } else {
      // Token expired - try refresh
      const refreshToken = getRefreshToken(cookies);
      if (refreshToken) {
        const newTokens = await refreshAccessToken(refreshToken);
        if (newTokens) {
          setAuthCookies(cookies, newTokens);
          const user = await getCurrentUser(newTokens.access_token);
          if (user) {
            context.locals.user = user;
            context.locals.token = newTokens.access_token;
          } else {
            clearAuthCookies(cookies);
          }
        } else {
          clearAuthCookies(cookies);
        }
      } else {
        clearAuthCookies(cookies);
      }
    }
  }

  // ─── Route protection ───
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !context.locals.user) {
    return redirect(
      `${LOGIN_ROUTE}?redirect=${encodeURIComponent(pathname)}`
    );
  }

  // Prevent logged-in users from accessing login/register
  if (
    context.locals.user &&
    (pathname === LOGIN_ROUTE || pathname === "/registro")
  ) {
    return redirect("/catalogo");
  }

  // ─── Process request ───
  const response = await next();

  // ─── Security Headers ───
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );

  if (IS_PRODUCTION) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Content Security Policy
  const imgSrc = PUBLIC_DIRECTUS_URL
    ? `'self' data: blob: ${PUBLIC_DIRECTUS_URL}`
    : "'self' data: blob:";

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src ${imgSrc}`,
      "connect-src 'self'",
      "frame-src https://challenges.cloudflare.com https://sis-t.redsys.es https://sis.redsys.es",
      "font-src 'self' https://fonts.gstatic.com",
      "base-uri 'self'",
      "form-action 'self' https://sis-t.redsys.es https://sis.redsys.es",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  return response;
});
