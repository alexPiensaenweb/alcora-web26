import { getTarifasForGrupo, directusAdmin, directusAuth } from '../../chunks/directus_tOieuaro.mjs';
import { r as resolveDiscount, c as calculatePrice } from '../../chunks/pricing_CdYilCUq.mjs';
import { c as calculateShipping } from '../../chunks/shipping_ByHlvqPN.mjs';
import { r as rateLimit, a as rateLimitResponse } from '../../chunks/rateLimit_CuWSIAKL.mjs';
import { a as buildPedidoHtml, s as sendMail, C as COMPANY_EMAILS } from '../../chunks/email_BwAn03_I.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request, locals }) => {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`submit:${clientIp}`, 10, 6e4);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);
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
      notas_cliente
    } = body;
    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "El carrito esta vacio" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const VALID_METODOS = ["transferencia", "pendiente"];
    if (metodo_pago && !VALID_METODOS.includes(metodo_pago)) {
      return new Response(
        JSON.stringify({ error: "Metodo de pago no valido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    for (const item of items) {
      if (typeof item.cantidad !== "number" || !Number.isInteger(item.cantidad) || item.cantidad < 1 || item.cantidad > 1e4) {
        return new Response(
          JSON.stringify({ error: "Cantidad no valida. Debe ser un numero entero entre 1 y 10.000" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    if (items.length > 100) {
      return new Response(
        JSON.stringify({ error: "Demasiados productos en el pedido (maximo 100)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const grupoCliente = locals.user.grupo_cliente;
    let tarifas = [];
    if (grupoCliente) {
      tarifas = await getTarifasForGrupo(grupoCliente, locals.token);
    }
    let subtotal = 0;
    const pedidoItems = [];
    for (const item of items) {
      let product;
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
      const categoriaId = typeof product.categoria === "object" ? product.categoria?.id : product.categoria;
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
        subtotal: Math.round(lineSubtotal * 100) / 100
      });
    }
    subtotal = Math.round(subtotal * 100) / 100;
    const costoEnvio = calculateShipping(subtotal);
    const total = Math.round((subtotal + costoEnvio) * 100) / 100;
    let pedidoRes;
    const pedidoData = {
      estado: "solicitado",
      subtotal,
      costo_envio: costoEnvio,
      total,
      metodo_pago: metodo_pago || "pendiente",
      direccion_envio: direccion_envio || locals.user.direccion_envio,
      direccion_facturacion: direccion_facturacion || locals.user.direccion_facturacion,
      notas_cliente: notas_cliente || null
    };
    try {
      pedidoRes = await directusAuth("/items/pedidos", locals.token, {
        method: "POST",
        body: JSON.stringify(pedidoData)
      });
    } catch {
      pedidoRes = await directusAdmin("/items/pedidos", {
        method: "POST",
        body: JSON.stringify({
          ...pedidoData,
          user_created: locals.user.id
        })
      });
    }
    const pedidoId = pedidoRes.data.id;
    for (const lineItem of pedidoItems) {
      await directusAdmin("/items/pedidos_items", {
        method: "POST",
        body: JSON.stringify({
          pedido: pedidoId,
          ...lineItem
        })
      });
    }
    const user = locals.user;
    const userName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Cliente";
    const userEmail = user.email;
    const userPhone = user.telefono || "";
    const userCompany = user.razon_social || "";
    const emailHtml = buildPedidoHtml({
      pedidoId,
      userName,
      userEmail,
      userPhone,
      userCompany,
      direccionEnvio: pedidoData.direccion_envio || "",
      direccionFacturacion: pedidoData.direccion_facturacion || "",
      metodoPago: pedidoData.metodo_pago,
      notasCliente: pedidoData.notas_cliente,
      items: pedidoItems.map((i) => ({
        nombre: i.nombre_producto,
        sku: i.sku,
        cantidad: i.cantidad,
        precioUnitario: i.precio_unitario
      })),
      subtotal,
      costoEnvio,
      total
    });
    try {
      await sendMail({
        to: COMPANY_EMAILS,
        subject: `Nuevo pedido #${pedidoId} - ${userCompany || userName}`,
        html: emailHtml
      });
    } catch (emailErr) {
      console.error("Error sending order notification to company:", emailErr);
    }
    try {
      await sendMail({
        to: userEmail,
        subject: `Su pedido #${pedidoId} - Alcora Salud Ambiental`,
        html: emailHtml
      });
    } catch (emailErr) {
      console.error("Error sending order confirmation to client:", emailErr);
    }
    return new Response(
      JSON.stringify({
        success: true,
        pedido: {
          id: pedidoId,
          total,
          estado: "solicitado"
        }
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Order submission error:", err instanceof Error ? err.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Error al procesar el pedido" }),
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
