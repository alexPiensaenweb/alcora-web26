/**
 * POST /pago-api/initiate
 *
 * Initiates a Redsys payment (card or Bizum) for a pedido.
 * - Auth orders: requires authentication + user ownership check
 * - Guest orders: requires guest_token for ownership verification
 * - Verifies pedido is in "aprobado_pendiente_pago" state
 * - Returns Redsys form parameters for redirect
 */
import type { APIRoute } from "astro";
import { directusAdmin } from "../../lib/directus";
import { createPaymentRequest, isRedsysConfigured, type RedsysPayMethod } from "../../lib/redsys";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";

const PUBLIC_SITE_URL =
  process.env.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL || "https://tienda.alcora.es";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Rate limit: 10 payment initiations per minute per IP
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`pago-init:${clientIp}`, 5, 900_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

    if (!isRedsysConfigured()) {
      return new Response(
        JSON.stringify({ error: "El pago online no esta disponible en este momento" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse body first (needed for both guest and auth flows)
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Body invalido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { pedidoId, guest_token } = body;
    if (!pedidoId) {
      return new Response(
        JSON.stringify({ error: "pedidoId requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch pedido with guest fields for ownership verification
    let pedido: any;
    try {
      const res = await directusAdmin(
        `/items/pedidos/${pedidoId}?fields=id,total,estado,user_created,metodo_pago,tipo_cliente,guest_token`
      );
      pedido = res.data;
    } catch {
      return new Response(
        JSON.stringify({ error: "Pedido no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!pedido) {
      return new Response(
        JSON.stringify({ error: "Pedido no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify ownership: branch on guest vs authenticated
    const isGuestOrder = pedido.tipo_cliente === "invitado";

    if (isGuestOrder) {
      // Guest ownership: verify via guest_token
      if (!guest_token || pedido.guest_token !== guest_token) {
        return new Response(
          JSON.stringify({ error: "No autorizado" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      // Authenticated ownership: verify via user ID
      if (!locals.user || !locals.token) {
        return new Response(
          JSON.stringify({ error: "Debe iniciar sesion" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      const pedidoUserId = typeof pedido.user_created === "object"
        ? pedido.user_created.id
        : pedido.user_created;
      if (pedidoUserId !== locals.user.id) {
        return new Response(
          JSON.stringify({ error: "No autorizado" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Verify state
    if (pedido.estado !== "aprobado_pendiente_pago") {
      return new Response(
        JSON.stringify({ error: "Este pedido no esta pendiente de pago" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify payment method is Redsys-compatible (tarjeta or bizum)
    const REDSYS_METHODS = ["tarjeta", "bizum"];
    if (!REDSYS_METHODS.includes(pedido.metodo_pago)) {
      return new Response(
        JSON.stringify({ error: "El metodo de pago de este pedido no es compatible con pago online" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Map our metodo_pago to Redsys pay method
    const payMethod: RedsysPayMethod = pedido.metodo_pago === "bizum" ? "bizum" : "card";

    // URL routing based on order type
    let urlOk: string;
    let urlKo: string;

    if (isGuestOrder) {
      // Guest: token-based URLs (non-guessable, NFR-1.4)
      urlOk = `${PUBLIC_SITE_URL}/pedido/${pedido.guest_token}?status=ok`;
      urlKo = `${PUBLIC_SITE_URL}/pedido/${pedido.guest_token}?status=ko`;
    } else {
      // Auth: existing numeric ID URLs
      urlOk = `${PUBLIC_SITE_URL}/pago/ok?pedido=${pedido.id}`;
      urlKo = `${PUBLIC_SITE_URL}/pago/ko?pedido=${pedido.id}`;
    }

    // Create Redsys payment request
    const result = createPaymentRequest({
      pedidoId: pedido.id,
      totalEur: pedido.total,
      merchantUrl: `${PUBLIC_SITE_URL}/pago-api/webhook`,
      urlOk,
      urlKo,
      payMethod,
    });

    // Save Redsys order ID for reference
    try {
      await directusAdmin(`/items/pedidos/${pedidoId}`, {
        method: "PATCH",
        body: JSON.stringify({ referencia_pago: result.redsysOrderId }),
      });
    } catch (err) {
      console.error("[pago-api/initiate] Error saving referencia_pago:", err);
    }

    return new Response(
      JSON.stringify({
        redsysUrl: result.redsysUrl,
        formParams: result.formParams,
        redsysOrderId: result.redsysOrderId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[pago-api/initiate] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error al iniciar el pago" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
