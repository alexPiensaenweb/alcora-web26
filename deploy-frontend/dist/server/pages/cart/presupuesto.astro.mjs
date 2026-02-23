import { b as buildPresupuestoHtml, s as sendMail, C as COMPANY_EMAILS } from '../../chunks/email_BwAn03_I.mjs';
import { r as rateLimit, a as rateLimitResponse } from '../../chunks/rateLimit_CuWSIAKL.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request, locals }) => {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`presupuesto:${clientIp}`, 3, 3e5);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);
    if (!locals.user || !locals.token) {
      return new Response(
        JSON.stringify({ error: "Debe iniciar sesion para solicitar un presupuesto" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const body = await request.json();
    const { items } = body;
    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay productos en la solicitud" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const user = locals.user;
    const userName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Cliente";
    const userEmail = user.email;
    const userPhone = user.telefono || "";
    const userCompany = user.razon_social || "";
    const html = buildPresupuestoHtml({
      userName,
      userEmail,
      userPhone,
      userCompany,
      items: items.map((i) => ({
        nombre: i.nombre,
        sku: i.sku,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        formato: i.formato
      }))
    });
    const subject = `Solicitud de presupuesto - ${userCompany || userName}`;
    await sendMail({
      to: COMPANY_EMAILS,
      subject,
      html
    });
    try {
      await sendMail({
        to: userEmail,
        subject: `Su solicitud de presupuesto - Alcora Salud Ambiental`,
        html
      });
    } catch (emailErr) {
      console.error("Error sending client copy email:", emailErr);
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Solicitud de presupuesto enviada correctamente"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown";
    console.error("Presupuesto error:", errorMsg);
    return new Response(
      JSON.stringify({ error: `Error al enviar la solicitud: ${errorMsg}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
