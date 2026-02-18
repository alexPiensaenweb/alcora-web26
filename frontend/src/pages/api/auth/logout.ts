import type { APIRoute } from "astro";
import { clearAuthCookies } from "../../../lib/auth";

export const POST: APIRoute = async ({ cookies }) => {
  clearAuthCookies(cookies);

  // Build response then append Set-Cookie headers individually
  // (multiple Set-Cookie headers cannot be joined with comma)
  const expireDate = "Thu, 01 Jan 1970 00:00:00 GMT";
  const response = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  response.headers.append(
    "Set-Cookie",
    `alcora_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=${expireDate}`
  );
  response.headers.append(
    "Set-Cookie",
    `alcora_refresh=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=${expireDate}`
  );

  return response;
};
