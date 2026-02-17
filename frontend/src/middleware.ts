/**
 * Astro Middleware - Auth guard + user injection
 *
 * Runs on every SSR request:
 * 1. Reads session cookie
 * 2. Validates token with Directus
 * 3. Auto-refreshes if expired
 * 4. Injects user into Astro.locals
 * 5. Protects specific routes
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

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect } = context;
  const pathname = url.pathname;

  // Default: no user
  context.locals.user = null;
  context.locals.token = null;

  // Try to authenticate from session cookie
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

  // Route protection
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

  return next();
});
