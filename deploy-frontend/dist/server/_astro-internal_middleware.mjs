import { d as defineMiddleware, s as sequence } from './chunks/index_CcpxF86g.mjs';
import { g as getSessionToken, a as getCurrentUser, b as getRefreshToken, r as refreshAccessToken, s as setAuthCookies, c as clearAuthCookies } from './chunks/auth_DzgKDLyR.mjs';
import 'es-module-lexer';
import './chunks/astro-designed-error-pages_Bj3gJ7tt.mjs';
import 'piccolore';
import './chunks/astro/server_VyRwZjg8.mjs';
import 'clsx';

const PROTECTED_ROUTES = ["/cuenta", "/checkout"];
const ADMIN_ROUTES = ["/gestion"];
const LOGIN_ROUTE = "/login";
const IS_PRODUCTION = process.env.NODE_ENV === "production" || (process.env.PUBLIC_SITE_URL || "").startsWith("https");
const PUBLIC_DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || "https://tienda.alcora.es";
const onRequest$1 = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect } = context;
  const pathname = url.pathname;
  context.locals.user = null;
  context.locals.token = null;
  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    const origin = context.request.headers.get("origin");
    const host = context.request.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new Response(
            JSON.stringify({ error: "Solicitud no autorizada" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "Solicitud no autorizada" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }
  }
  let token = getSessionToken(cookies);
  if (token) {
    const user = await getCurrentUser(token);
    if (user) {
      context.locals.user = user;
      context.locals.token = token;
    } else {
      const refreshToken = getRefreshToken(cookies);
      if (refreshToken) {
        const newTokens = await refreshAccessToken(refreshToken);
        if (newTokens) {
          setAuthCookies(cookies, newTokens);
          const user2 = await getCurrentUser(newTokens.access_token);
          if (user2) {
            context.locals.user = user2;
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
  const isApiRoute = pathname.startsWith("/cuenta-api") || pathname.startsWith("/cart/") || pathname.startsWith("/gestion-api") || pathname.startsWith("/products-api") || pathname.startsWith("/search/");
  const isProtected = !isApiRoute && PROTECTED_ROUTES.some(
    (route) => pathname.startsWith(route)
  );
  if (isProtected && !context.locals.user) {
    return redirect(
      `${LOGIN_ROUTE}?redirect=${encodeURIComponent(pathname)}`
    );
  }
  const isAdminRoute = ADMIN_ROUTES.some(
    (route) => pathname.startsWith(route)
  );
  if (isAdminRoute) {
    if (!context.locals.user) {
      return redirect(`${LOGIN_ROUTE}?redirect=${encodeURIComponent(pathname)}`);
    }
    if (!context.locals.user.isAdmin) {
      return redirect("/cuenta");
    }
  }
  if (context.locals.user && (pathname === LOGIN_ROUTE || pathname === "/registro")) {
    return redirect(context.locals.user.isAdmin ? "/gestion" : "/catalogo");
  }
  if (isProtected && context.locals.user && !context.locals.user.isAdmin && context.locals.user.status !== "active") {
    return redirect("/login?pendiente=1");
  }
  const response = await next();
  if (pathname.startsWith("/gestion")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }
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
  const imgSrc = `'self' data: blob: ${PUBLIC_DIRECTUS_URL}` ;
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src ${imgSrc}`,
      "connect-src 'self' blob:",
      "worker-src 'self' blob:",
      "frame-src https://challenges.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join("; ")
  );
  return response;
});

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
