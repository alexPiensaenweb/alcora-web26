import type { APIRoute } from "astro";
import { createPaymentForm } from "../../../lib/redsys";
import { directusAuth, directusAdmin } from "../../../lib/directus";

/**
 * POST /api/checkout/redsys-signature
 *
 * Recibe { pedidoId } y devuelve los parametros firmados para
 * enviar al TPV virtual de Redsys.
 *
 * El frontend hace un form submit automatico a la URL de Redsys.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user || !locals.token) {
      return new Response(
        JSON.stringify({ error: "No autenticado" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { pedidoId } = (await request.json()) as { pedidoId: number };

    if (!pedidoId) {
      return new Response(
        JSON.stringify({ error: "pedidoId requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar que el pedido existe y pertenece al usuario
    let pedido: any;
    try {
      const pedidoRes = await directusAuth(
        `/items/pedidos/${pedidoId}?fields=id,total,estado,user_created`,
        locals.token
      );
      pedido = pedidoRes.data;
    } catch {
      // Fallback to admin token if user can't read their own pedido
      const pedidoRes = await directusAdmin(
        `/items/pedidos/${pedidoId}?fields=id,total,estado,user_created`
      );
      pedido = pedidoRes.data;
      // Verify ownership
      if (pedido && pedido.user_created !== locals.user.id) {
        return new Response(
          JSON.stringify({ error: "No tiene permiso para este pedido" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!pedido) {
      return new Response(
        JSON.stringify({ error: "Pedido no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Solo permitir pago en pedidos con estado correcto
    if (pedido.estado !== "aprobado_pendiente_pago") {
      return new Response(
        JSON.stringify({ error: "Este pedido no esta pendiente de pago" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const formData = createPaymentForm({
      pedidoId: pedido.id,
      amount: pedido.total,
      description: `Pedido #${pedido.id} - Alcora`,
    });

    return new Response(JSON.stringify(formData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Redsys signature error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error generando firma Redsys" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
