import type { APIRoute } from "astro";
import { sendMail, buildPresupuestoHtml, COMPANY_EMAILS } from "../../../lib/email";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Rate limit: 3 presupuesto requests per 5 minutes per IP
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`presupuesto:${clientIp}`, 3, 300_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

    if (!locals.user || !locals.token) {
      return new Response(
        JSON.stringify({ error: "Debe iniciar sesion para solicitar un presupuesto" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { items } = body as {
      items: {
        productoId: string;
        nombre: string;
        sku: string;
        cantidad: number;
        precioUnitario: number;
        formato: string | null;
      }[];
    };

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
        formato: i.formato,
      })),
    });

    const subject = `Solicitud de presupuesto - ${userCompany || userName}`;

    // Send to company
    await sendMail({
      to: COMPANY_EMAILS,
      subject,
      html,
    });

    // Send copy to client
    try {
      await sendMail({
        to: userEmail,
        subject: `Su solicitud de presupuesto - Alcora Salud Ambiental`,
        html,
      });
    } catch (emailErr) {
      // Don't fail the whole request if client copy fails
      console.error("Error sending client copy email:", emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Solicitud de presupuesto enviada correctamente",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Presupuesto error:", err instanceof Error ? err.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Error al enviar la solicitud de presupuesto" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
