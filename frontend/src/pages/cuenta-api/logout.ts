import type { APIRoute } from "astro";
import { clearAuthCookies } from "../../lib/auth";

/**
 * POST /cuenta-api/logout
 * GET  /cuenta-api/logout (fallback)
 *
 * Clears auth cookies and:
 * - HTML form/navigation → redirects to /login
 * - fetch() call → returns JSON
 */

const expireDate = "Thu, 01 Jan 1970 00:00:00 GMT";
const cookieHeaders = [
  `alcora_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=${expireDate}`,
  `alcora_refresh=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=${expireDate}`,
];

function isFormRequest(request: Request): boolean {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";
  // HTML form sends accept starting with "text/html,"
  // Also check for form content-type (multipart/form-data or application/x-www-form-urlencoded)
  if (accept.startsWith("text/html")) return true;
  if (contentType.includes("form-data") || contentType.includes("urlencoded")) return true;
  return false;
}

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  clearAuthCookies(cookies);

  // Form POST → redirect
  if (isFormRequest(request)) {
    const res = redirect("/login", 302);
    cookieHeaders.forEach((c) => res.headers.append("Set-Cookie", c));
    return res;
  }

  // fetch() POST → JSON response
  const response = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  cookieHeaders.forEach((c) => response.headers.append("Set-Cookie", c));
  return response;
};

// GET fallback — direct navigation to /cuenta-api/logout
export const GET: APIRoute = async ({ cookies, redirect }) => {
  clearAuthCookies(cookies);
  const res = redirect("/login", 302);
  cookieHeaders.forEach((c) => res.headers.append("Set-Cookie", c));
  return res;
};
