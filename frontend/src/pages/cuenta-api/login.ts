import type { APIRoute } from "astro";
import { loginWithCredentials, setAuthCookies, getCurrentUser } from "../../lib/auth";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { verifyTurnstile } from "../../lib/turnstile";
import { validateSchema, loginSchema } from "../../lib/schemas";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`login:${clientIp}`, 10, 900_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
    }

    const validation = validateSchema(loginSchema, body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    const { email, password, turnstileToken } = validation.data;

    const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || import.meta.env.TURNSTILE_SECRET_KEY || "";
    const turnstileRequired = !!TURNSTILE_SECRET && !TURNSTILE_SECRET.startsWith("1x00000");
    if (turnstileRequired && !turnstileToken) {
      return new Response(
        JSON.stringify({ error: "Verificacion de seguridad requerida. Recargue la pagina." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (turnstileToken) {
      const turnstileOk = await verifyTurnstile(turnstileToken);
      if (!turnstileOk) {
        return new Response(
          JSON.stringify({ error: "Verificacion de seguridad fallida. Recargue la pagina." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Try login - will fail if user is suspended/inactive
    let tokens;
    try {
      tokens = await loginWithCredentials(email, password);
    } catch (loginErr: any) {
      // Generic message to avoid user enumeration
      const errorMessage = loginErr?.message || "";
      // Directus returns specific errors for suspended users
      if (errorMessage.includes("suspended") || errorMessage.includes("FORBIDDEN")) {
        return new Response(
          JSON.stringify({
            error: "Su solicitud de registro esta pendiente de validacion. Le avisaremos por email cuando sea aprobada.",
            status: "suspended",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      throw loginErr;
    }

    setAuthCookies(cookies, tokens);

    const user = await getCurrentUser(tokens.access_token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "No se pudo obtener el perfil de usuario" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Non-admin users must be active
    if (!user.isAdmin && user.status !== "active") {
      const errorMsg =
        user.status === "suspended"
          ? "Su solicitud de registro esta pendiente de validacion. Le avisaremos por email cuando sea aprobada."
          : "Su cuenta no esta activa. Contacte con nosotros.";
      return new Response(
        JSON.stringify({ error: errorMsg, status: user.status }),
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
          isAdmin: user.isAdmin,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Login error:", err instanceof Error ? err.message : "Unknown");
    // Check if this is a structured Response we need to pass through
    if (err instanceof Response) return err;
    return new Response(
      JSON.stringify({ error: "Credenciales invalidas" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
};
