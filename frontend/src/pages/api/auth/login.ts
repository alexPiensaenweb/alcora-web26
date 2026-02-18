import type { APIRoute } from "astro";
import { loginWithCredentials, setAuthCookies, getCurrentUser } from "../../../lib/auth";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";
import { verifyTurnstile } from "../../../lib/turnstile";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Rate limit: 5 login attempts per minute per IP
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`login:${clientIp}`, 5, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

    const { email, password, turnstileToken } = await request.json();

    // Verify Turnstile CAPTCHA
    if (turnstileToken) {
      const turnstileOk = await verifyTurnstile(turnstileToken);
      if (!turnstileOk) {
        return new Response(
          JSON.stringify({ error: "Verificacion de seguridad fallida. Recargue la pagina." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email y contrasena son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const tokens = await loginWithCredentials(email, password);
    setAuthCookies(cookies, tokens);

    const user = await getCurrentUser(tokens.access_token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "No se pudo obtener el perfil de usuario" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (user.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Su cuenta aun no ha sido activada. Contacte con nosotros." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          grupo_cliente: user.grupo_cliente,
          razon_social: user.razon_social,
          status: user.status,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Login error:", err instanceof Error ? err.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Credenciales invalidas" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
};
