import type { APIRoute } from "astro";
import { clearAuthCookies } from "../../lib/auth";

/**
 * POST /auth/logout
 *
 * Ruta de logout movida fuera de /api para evitar que el proxy Apache
 * intercepte las peticiones (Apache redirige /api/* → Directus en 8055).
 */
export const POST: APIRoute = async ({ cookies }) => {
  clearAuthCookies(cookies);

  const expireDate = "Thu, 01 Jan 1970 00:00:00 GMT";
  const response = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  // Explicitly clear both cookies with multiple Set-Cookie headers
  response.headers.append(
    "Set-Cookie",
    `alcora_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=${expireDate}`
  );
  response.headers.append(
    "Set-Cookie",
    `alcora_refresh=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=${expireDate}`
  );

  return response;
};
