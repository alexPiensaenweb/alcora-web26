import type { APIRoute } from "astro";
import { directusAuth, directusAdmin, getTarifasForGrupo } from "../../../lib/directus";
import { resolveDiscount, calculatePrice } from "../../../lib/pricing";
import { calculateShipping } from "../../../lib/shipping";
import type { CartItem } from "../../../lib/types";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user || !locals.token) {
      return new Response(
        JSON.stringify({ error: "Debe iniciar sesion para realizar un pedido" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const {
      items,
      direccion_envio,
      direccion_facturacion,
      metodo_pago,
      notas_cliente,
    } = body as {
      items: CartItem[];
      direccion_envio: string;
      direccion_facturacion: string;
      metodo_pago: "transferencia" | "tarjeta" | "pendiente";
      notas_cliente?: string;
    };

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "El carrito esta vacio" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user's discount tariffs
    const grupoCliente = locals.user.grupo_cliente;
    let tarifas: any[] = [];
    if (grupoCliente) {
      tarifas = await getTarifasForGrupo(grupoCliente, locals.token);
    }

    // Re-calculate prices server-side (never trust client)
    let subtotal = 0;
    const pedidoItems: any[] = [];

    for (const item of items) {
      // Fetch product from Directus by ID to get real precio_base
      let product: any;
      try {
        const productRes = await directusAdmin(
          `/items/productos/${encodeURIComponent(item.productoId)}?fields=id,nombre,sku,precio_base,categoria`
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

      const categoriaId =
        typeof product.categoria === "object"
          ? product.categoria?.id
          : product.categoria;

      const descuento = resolveDiscount(tarifas, product.id, categoriaId);
      const precioUnitario = calculatePrice(product.precio_base, descuento);
      const lineSubtotal = precioUnitario * item.cantidad;

      subtotal += lineSubtotal;

      pedidoItems.push({
        producto: product.id,
        nombre_producto: product.nombre,
        sku: product.sku,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario,
        subtotal: Math.round(lineSubtotal * 100) / 100,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const costoEnvio = calculateShipping(subtotal);
    const total = Math.round((subtotal + costoEnvio) * 100) / 100;

    // Create pedido using user's token (so user_created is set correctly)
    // Fall back to admin token if user token fails (permission issues)
    let pedidoRes: any;
    const pedidoData = {
      estado: "solicitado",
      subtotal,
      costo_envio: costoEnvio,
      total,
      metodo_pago: metodo_pago || "pendiente",
      direccion_envio: direccion_envio || locals.user.direccion_envio,
      direccion_facturacion:
        direccion_facturacion || locals.user.direccion_facturacion,
      notas_cliente: notas_cliente || null,
    };

    try {
      pedidoRes = await directusAuth("/items/pedidos", locals.token, {
        method: "POST",
        body: JSON.stringify(pedidoData),
      });
    } catch {
      // Fallback: use admin token but set user_created explicitly
      pedidoRes = await directusAdmin("/items/pedidos", {
        method: "POST",
        body: JSON.stringify({
          ...pedidoData,
          user_created: locals.user.id,
        }),
      });
    }

    const pedidoId = pedidoRes.data.id;

    // Create pedido items separately
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
          total,
          estado: "solicitado",
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Order submission error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error al procesar el pedido" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
