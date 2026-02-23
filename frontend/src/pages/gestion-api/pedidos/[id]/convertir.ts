import type { APIRoute } from "astro";
import { directusAdmin } from "../../../../lib/directus";
import { calculateShipping } from "../../../../lib/shipping";

/**
 * Convert presupuesto → pedido
 *
 * POST /gestion-api/pedidos/[id]/convertir
 *
 * Changes: tipo → "pedido", estado → "aprobado_pendiente_pago"
 * Calculates shipping based on subtotal
 */
export const POST: APIRoute = async ({ params, locals }) => {
  if (!locals.user?.isAdmin) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "ID requerido" }), { status: 400 });
  }

  try {
    // Fetch current presupuesto
    const pedidoRes = await directusAdmin(`/items/pedidos/${id}?fields=id,tipo,subtotal,estado`);
    const pedido = pedidoRes.data;
    if (!pedido) {
      return new Response(JSON.stringify({ error: "Presupuesto no encontrado" }), { status: 404 });
    }
    if (pedido.tipo !== "presupuesto") {
      return new Response(JSON.stringify({ error: "Este registro ya es un pedido" }), { status: 400 });
    }

    // Verify it has items
    const itemsRes = await directusAdmin(
      `/items/pedidos_items?filter[pedido][_eq]=${id}&fields=id&limit=1`
    );
    if (!itemsRes.data || itemsRes.data.length === 0) {
      return new Response(
        JSON.stringify({ error: "El presupuesto no tiene items. Añada productos antes de convertir." }),
        { status: 400 }
      );
    }

    // Calculate shipping
    const subtotal = Number(pedido.subtotal || 0);
    const costoEnvio = calculateShipping(subtotal);
    const total = Math.round((subtotal + costoEnvio) * 100) / 100;

    // Update: convert to pedido
    await directusAdmin(`/items/pedidos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        tipo: "pedido",
        estado: "aprobado_pendiente_pago",
        costo_envio: costoEnvio,
        total,
      }),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        pedido: { id: Number(id), tipo: "pedido", estado: "aprobado_pendiente_pago", costoEnvio, total },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[api/admin/pedidos/convertir]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
