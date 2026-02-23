import { l as loginWithCredentials, s as setAuthCookies, a as getCurrentUser } from '../../chunks/auth_DzgKDLyR.mjs';
import { directusAdmin } from '../../chunks/directus_tOieuaro.mjs';
import { r as rateLimit, a as rateLimitResponse } from '../../chunks/rateLimit_CuWSIAKL.mjs';
import { v as verifyTurnstile } from '../../chunks/turnstile_BT-Rxfyg.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`login:${clientIp}`, 5, 6e4);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);
    const { email, password, turnstileToken } = await request.json();
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
    let tokens;
    try {
      tokens = await loginWithCredentials(email, password);
    } catch (loginErr) {
      try {
        const lookupRes = await directusAdmin(
          `/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id,status,role.policies.policy.admin_access&limit=1`
        );
        const foundUser = lookupRes.data?.[0];
        const isFoundAdmin = foundUser?.role?.policies?.some(
          (rp) => rp?.policy?.admin_access === true
        );
        if (foundUser && isFoundAdmin && foundUser.status !== "active") {
          await directusAdmin(`/users/${foundUser.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "active" })
          });
          tokens = await loginWithCredentials(email, password);
        } else if (foundUser && foundUser.status === "suspended") {
          return new Response(
            JSON.stringify({
              error: "Su solicitud de registro esta pendiente de validacion. Le avisaremos por email cuando sea aprobada.",
              status: "suspended"
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        } else {
          throw loginErr;
        }
      } catch (adminErr) {
        if (adminErr instanceof Response) throw adminErr;
        if (adminErr?.message?.includes("pendiente")) throw adminErr;
        throw loginErr;
      }
    }
    setAuthCookies(cookies, tokens);
    const user = await getCurrentUser(tokens.access_token);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "No se pudo obtener el perfil de usuario" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!user.isAdmin && user.status !== "active") {
      const errorMsg = user.status === "suspended" ? "Su solicitud de registro esta pendiente de validacion. Le avisaremos por email cuando sea aprobada." : "Su cuenta no esta activa. Contacte con nosotros.";
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
          isAdmin: user.isAdmin
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Login error:", err instanceof Error ? err.message : "Unknown");
    if (err instanceof Response) return err;
    return new Response(
      JSON.stringify({ error: "Credenciales invalidas" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
