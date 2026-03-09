import type { APIRoute } from "astro";
import { directusAuth, directusAdmin, getTarifasForGrupo } from "../../lib/directus";
import { resolveDiscount, calculatePrice, isProfessionalUser } from "../../lib/pricing";
import { calculateShipping } from "../../lib/shipping";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { sendMail, buildPedidoHtml, getCompanyEmail } from "../../lib/email";
import { validateSchema, pedidoSubmitSchema } from "../../lib/schemas";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(`submit:${clientIp}`, 5, 300_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

    if (!locals.user || !locals.token) {
      return new Response(
        JSON.stringify({ error: "Debe iniciar sesion para realizar un pedido" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
    }

    const validation = validateSchema(pedidoSubmitSchema, body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
    }

    const { items, direccion_envio, direccion_facturacion, metodo_pago, notas_cliente } = validation.data;

    const grupoCliente = locals.user.grupo_cliente;
    let tarifas: any[] = [];
    if (grupoCliente) {
      tarifas = await getTarifasForGrupo(grupoCliente, locals.token);
    }

    // Re-calculate prices server-side (never trust client)
    let subtotal = 0;
    const pedidoItems: any[] = [];

    for (const item of items) {
      let product: any;
      try {
        const productRes = await directusAdmin(
          `/items/productos/${encodeURIComponent(item.productoId)}?fields=id,nombre,sku,precio_base,categoria,solo_profesional,segmento_venta`
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

      // Block professional-only products for particulares
      if (product.solo_profesional && locals.user.grupo_cliente === "particular") {
        return new Response(
          JSON.stringify({ error: `El producto "${product.nombre}" no esta disponible para particulares` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Block B2B-only products for non-professionals (segmento_venta check)
      if (product.segmento_venta === 'b2b' && !isProfessionalUser(locals.user)) {
        return new Response(
          JSON.stringify({ error: `El producto "${product.nombre}" no esta disponible para particulares` }),
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

    // Estado: tarjeta/bizum → "aprobado_pendiente_pago" (awaiting Redsys payment)
    //         other methods → "solicitado" (awaiting manual confirmation)
    const isRedsysPayment = metodo_pago === "tarjeta" || metodo_pago === "bizum";
    const initialEstado = isRedsysPayment ? "aprobado_pendiente_pago" : "solicitado";
    let pedidoRes: any;
    const pedidoData = {
      estado: initialEstado,
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
      pedidoRes = await directusAdmin("/items/pedidos", {
        method: "POST",
        body: JSON.stringify({
          ...pedidoData,
          user_created: locals.user.id,
        }),
      });
    }

    const pedidoId = pedidoRes.data.id;

    for (const lineItem of pedidoItems) {
      await directusAdmin("/items/pedidos_items", {
        method: "POST",
        body: JSON.stringify({
          pedido: pedidoId,
          ...lineItem,
        }),
      });
    }

    // Send email notification for non-Redsys payments
    // Card/Bizum payments: emails sent after successful Redsys webhook
    if (!isRedsysPayment) {
      const user = locals.user;
      const userName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Cliente";
      const userEmail = user.email;
      const userPhone = user.telefono || "";
      const userCompany = user.razon_social || "";
      const companyEmail = await getCompanyEmail();

      const emailBaseData = {
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
          precioUnitario: i.precio_unitario,
        })),
        subtotal,
        costoEnvio,
        total,
      };

      const adminHtml = buildPedidoHtml({
        ...emailBaseData,
        cta: { label: "Gestionar pedido", url: "https://tienda.alcora.es/gestion/pedidos" },
      });

      const clientHtml = buildPedidoHtml({
        ...emailBaseData,
        cta: { label: "Ver mis pedidos", url: "https://tienda.alcora.es/cuenta/pedidos" },
      });

      try {
        await sendMail({
          to: companyEmail,
          subject: `Nuevo pedido #${pedidoId} - ${userCompany || userName}`,
          html: adminHtml,
          replyTo: userEmail,
        });
      } catch (emailErr) {
        console.error("Error sending order notification to company:", emailErr);
      }

      try {
        await sendMail({
          to: userEmail,
          subject: `Su pedido #${pedidoId} - Alcora Salud Ambiental`,
          html: clientHtml,
          replyTo: companyEmail,
        });
      } catch (emailErr) {
        console.error("Error sending order confirmation to client:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        pedido: {
          id: pedidoId,
          total,
          estado: initialEstado,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Order submission error:", err instanceof Error ? err.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Error al procesar el pedido" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
