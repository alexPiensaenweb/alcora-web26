import type { APIRoute } from "astro";
import { clearAuthCookies } from "../../../lib/auth";

export const POST: APIRoute = async ({ cookies }) => {
  clearAuthCookies(cookies);

  // Also set explicit Set-Cookie headers to ensure browsers clear the cookies
  const expireDate = "Thu, 01 Jan 1970 00:00:00 GMT";
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": [
        `alcora_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=${expireDate}`,
        `alcora_refresh=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=${expireDate}`,
      ].join(", "),
    },
  });
};
