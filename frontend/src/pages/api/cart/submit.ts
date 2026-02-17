import type { APIRoute } from "astro";
import { directusAuth, getTarifasForGrupo } from "../../../lib/directus";
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
      metodo_pago: "transferencia" | "tarjeta";
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
      // Fetch product from Directus by SKU/ID to get real precio_base
      const productRes = await directusAuth(
        `/items/productos?filter[sku][_eq]=${encodeURIComponent(item.productoId)}&fields=id,nombre,sku,precio_base,categoria&limit=1`,
        locals.token
      );
      const product = productRes.data?.[0];

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

    // Create pedido in Directus
    const pedidoRes = await directusAuth("/items/pedidos", locals.token, {
      method: "POST",
      body: JSON.stringify({
        estado: "aprobado_pendiente_pago",
        subtotal,
        costo_envio: costoEnvio,
        total,
        metodo_pago: metodo_pago || "transferencia",
        direccion_envio: direccion_envio || locals.user.direccion_envio,
        direccion_facturacion:
          direccion_facturacion || locals.user.direccion_facturacion,
        notas_cliente: notas_cliente || null,
        items: pedidoItems,
      }),
    });

    return new Response(
      JSON.stringify({
        success: true,
        pedido: {
          id: pedidoRes.data.id,
          total,
          estado: "aprobado_pendiente_pago",
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
