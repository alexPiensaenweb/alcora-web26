import type { APIRoute } from "astro";
import { loginWithCredentials, setAuthCookies, getCurrentUser } from "../../lib/auth";
import { directusAdmin } from "../../lib/directus";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { verifyTurnstile } from "../../lib/turnstile";

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

    // Try login - may fail if user is suspended/inactive in Directus
    let tokens;
    try {
      tokens = await loginWithCredentials(email, password);
    } catch (loginErr: any) {
      // Login failed - check if user is admin and needs auto-activation
      // Use admin token to look up the user
      try {
        const lookupRes = await directusAdmin(
          `/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id,status,role.admin_access&limit=1`
        );
        const foundUser = lookupRes.data?.[0];

        if (foundUser && foundUser.role?.admin_access === true && foundUser.status !== "active") {
          // Admin user is not active - auto-activate and retry login
          await directusAdmin(`/users/${foundUser.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "active" }),
          });
          // Retry login after activation
          tokens = await loginWithCredentials(email, password);
        } else if (foundUser && foundUser.status === "suspended") {
          // Non-admin suspended user - pending validation
          return new Response(
            JSON.stringify({
              error: "Su solicitud de registro esta pendiente de validacion. Le avisaremos por email cuando sea aprobada.",
              status: "suspended",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        } else {
          // Bad credentials or other issue
          throw loginErr;
        }
      } catch (adminErr: any) {
        // If admin lookup threw a structured Response, propagate it
        if (adminErr instanceof Response) throw adminErr;
        // If the error message suggests it's our custom error, re-throw
        if (adminErr?.message?.includes("pendiente")) throw adminErr;
        // Otherwise it's bad credentials
        throw loginErr;
      }
    }

    setAuthCookies(cookies, tokens);

    const user = await getCurrentUser(tokens.access_token);

    console.log("Login user data:", JSON.stringify({ email, status: user?.status, isAdmin: user?.isAdmin, role: user?.role }));

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
