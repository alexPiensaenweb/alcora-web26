import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { directusAdmin } from "../../lib/directus";
import { calculateB2CPrice } from "../../lib/pricing";
import { calculateShipping } from "../../lib/shipping";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { verifyTurnstile } from "../../lib/turnstile";
import { validateSchema, pedidoGuestSchema } from "../../lib/schemas";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit by IP (same as submit: 5 per 5 min)
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`guest-submit:${clientIp}`, 5, 300_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Body invalido" }), { status: 400 });
    }

    const validation = validateSchema(pedidoGuestSchema, body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    const { items, guest_email, guest_nombre, guest_telefono, guest_direccion, metodo_pago, notas_cliente, turnstileToken } = validation.data;

    // Verify Turnstile token
    const turnstileValid = await verifyTurnstile(turnstileToken);
    if (!turnstileValid) {
      return new Response(
        JSON.stringify({ error: "Verificacion de seguridad fallida. Recargue la pagina e intente de nuevo." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate items and compute B2C prices (server-side, never trust client)
    let subtotalSinIva = 0;
    let totalConIva = 0;
    const pedidoItems: any[] = [];
    const ivaMap = new Map<number, number>(); // rate -> base

    for (const item of items) {
      let product: any;
      try {
        const productRes = await directusAdmin(
          `/items/productos/${encodeURIComponent(item.productoId)}?fields=id,nombre,sku,precio_base,categoria,segmento_venta,tipo_iva`
        );
        product = productRes.data;
      } catch {
        return new Response(
          JSON.stringify({ error: `Producto no encontrado: ${item.productoId}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!product) {
        return new Response(
          JSON.stringify({ error: `Producto no encontrado: ${item.productoId}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Block B2B-only products for guests
      if (product.segmento_venta === "b2b") {
        return new Response(
          JSON.stringify({ error: `El producto "${product.nombre}" no esta disponible para compra online` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const tipoIva = product.tipo_iva || 21;
      const precioBase = product.precio_base;
      const precioConIva = calculateB2CPrice(precioBase, tipoIva);
      const lineSubtotalSinIva = precioBase * item.cantidad;
      const lineSubtotalConIva = precioConIva * item.cantidad;

      subtotalSinIva += lineSubtotalSinIva;
      totalConIva += lineSubtotalConIva;

      // Track IVA by rate for breakdown
      ivaMap.set(tipoIva, (ivaMap.get(tipoIva) || 0) + lineSubtotalSinIva);

      pedidoItems.push({
        producto: product.id,
        nombre_producto: product.nombre,
        sku: product.sku,
        cantidad: item.cantidad,
        precio_unitario: Math.round(precioConIva * 100) / 100, // Store IVA-inclusive unit price for B2C
        subtotal: Math.round(lineSubtotalConIva * 100) / 100,
      });
    }

    subtotalSinIva = Math.round(subtotalSinIva * 100) / 100;
    totalConIva = Math.round(totalConIva * 100) / 100;

    // Shipping with IVA (21% for transport in Spain)
    const shippingSinIva = calculateShipping(subtotalSinIva);
    const shippingIva = shippingSinIva > 0 ? Math.round(shippingSinIva * 0.21 * 100) / 100 : 0;
    const shippingConIva = Math.round((shippingSinIva + shippingIva) * 100) / 100;

    // Total = products con IVA + shipping con IVA
    const total = Math.round((totalConIva + shippingConIva) * 100) / 100;

    // Generate guest token (UUID v4, cryptographically secure)
    const guestToken = randomUUID();

    // Create pedido via admin API (guests have no auth token)
    const isRedsysPayment = metodo_pago === "tarjeta" || metodo_pago === "bizum";
    const initialEstado = isRedsysPayment ? "aprobado_pendiente_pago" : "solicitado";

    let pedidoRes: any;
    try {
      pedidoRes = await directusAdmin("/items/pedidos", {
        method: "POST",
        body: JSON.stringify({
          estado: initialEstado,
          subtotal: totalConIva, // Store IVA-inclusive subtotal for B2C orders
          costo_envio: shippingConIva,
          total,
          metodo_pago: metodo_pago || "tarjeta",
          tipo_cliente: "invitado",
          guest_email,
          guest_nombre,
          guest_telefono: guest_telefono || null,
          guest_direccion,
          guest_token: guestToken,
          direccion_envio: guest_direccion,
          notas_cliente: notas_cliente || null,
          user_created: null,
        }),
      });
    } catch (err) {
      console.error("[guest-submit] Error creating pedido:", err);
      return new Response(
        JSON.stringify({ error: "Error al crear el pedido" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const pedidoId = pedidoRes.data.id;

    // Create pedido items
    for (const lineItem of pedidoItems) {
      await directusAdmin("/items/pedidos_items", {
        method: "POST",
        body: JSON.stringify({
          pedido: pedidoId,
          ...lineItem,
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        pedido: {
          id: pedidoId,
          guest_token: guestToken,
          total,
          estado: initialEstado,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[guest-submit] Error:", err instanceof Error ? err.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Error al procesar el pedido" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
