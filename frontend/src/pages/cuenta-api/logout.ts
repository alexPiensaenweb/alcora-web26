import type { APIRoute } from "astro";
import { clearAuthCookies } from "../../lib/auth";

/**
 * POST /cuenta-api/logout
 *
 * Supports both:
 * - HTML form POST (redirects to /login)
 * - fetch() POST (returns JSON)
 *
 * GET /cuenta-api/logout — fallback redirect to /login
 */

const expireDate = "Thu, 01 Jan 1970 00:00:00 GMT";
const cookieHeaders = [
  `alcora_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=${expireDate}`,
  `alcora_refresh=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=${expireDate}`,
];

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  clearAuthCookies(cookies);

  // If request comes from HTML form, redirect to login
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    const res = redirect("/login", 302);
    cookieHeaders.forEach((c) => res.headers.append("Set-Cookie", c));
    return res;
  }

  // Otherwise return JSON for fetch() calls
  const response = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  cookieHeaders.forEach((c) => response.headers.append("Set-Cookie", c));

  return response;
};

// GET fallback — if someone navigates to /cuenta-api/logout directly
export const GET: APIRoute = async ({ cookies, redirect }) => {
  clearAuthCookies(cookies);
  const res = redirect("/login", 302);
  cookieHeaders.forEach((c) => res.headers.append("Set-Cookie", c));
  return res;
};
