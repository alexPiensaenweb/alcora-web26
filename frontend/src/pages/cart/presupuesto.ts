import type { APIRoute } from "astro";
import { directusAuth, directusAdmin, getTarifasForGrupo } from "../../lib/directus";
import { resolveDiscount, calculatePrice } from "../../lib/pricing";
import { sendMail, buildPresupuestoHtml, getCompanyEmail } from "../../lib/email";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import type { CartItem } from "../../lib/types";

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
    const { items, notas_cliente } = body as {
      items: CartItem[];
      notas_cliente?: string;
    };

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay productos en la solicitud" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate item quantities
    for (const item of items) {
      if (
        typeof item.cantidad !== "number" ||
        !Number.isInteger(item.cantidad) ||
        item.cantidad < 1 ||
        item.cantidad > 10000
      ) {
        return new Response(
          JSON.stringify({ error: "Cantidad no valida. Debe ser un numero entero entre 1 y 10.000" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (items.length > 100) {
      return new Response(
        JSON.stringify({ error: "Demasiados productos en la solicitud (maximo 100)" }),
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
    const presupuestoItems: any[] = [];

    for (const item of items) {
      let product: any;
      try {
        const productRes = await directusAdmin(
          `/items/productos/${encodeURIComponent(item.productoId)}?fields=id,nombre,sku,precio_base,categoria,formato,solo_profesional`
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

      const categoriaId =
        typeof product.categoria === "object"
          ? product.categoria?.id
          : product.categoria;

      const descuento = resolveDiscount(tarifas, product.id, categoriaId);
      const precioUnitario = calculatePrice(product.precio_base, descuento);
      const lineSubtotal = precioUnitario * item.cantidad;

      subtotal += lineSubtotal;

      presupuestoItems.push({
        producto: product.id,
        nombre_producto: product.nombre,
        sku: product.sku,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario,
        subtotal: Math.round(lineSubtotal * 100) / 100,
        formato: product.formato || null,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Create presupuesto in Directus (tipo = "presupuesto", no shipping)
    const presupuestoData = {
      tipo: "presupuesto",
      estado: "presupuesto_solicitado",
      subtotal,
      costo_envio: 0,
      total: subtotal,
      metodo_pago: "pendiente",
      direccion_envio: locals.user.direccion_envio || null,
      direccion_facturacion: locals.user.direccion_facturacion || null,
      notas_cliente: notas_cliente || null,
    };

    let presupuestoRes: any;
    try {
      presupuestoRes = await directusAuth("/items/pedidos", locals.token, {
        method: "POST",
        body: JSON.stringify(presupuestoData),
      });
    } catch {
      // Fallback: use admin token but set user_created explicitly
      presupuestoRes = await directusAdmin("/items/pedidos", {
        method: "POST",
        body: JSON.stringify({
          ...presupuestoData,
          user_created: locals.user.id,
        }),
      });
    }

    const presupuestoId = presupuestoRes.data.id;

    // Create presupuesto items
    for (const lineItem of presupuestoItems) {
      await directusAdmin("/items/pedidos_items", {
        method: "POST",
        body: JSON.stringify({
          pedido: presupuestoId,
          producto: lineItem.producto,
          nombre_producto: lineItem.nombre_producto,
          sku: lineItem.sku,
          cantidad: lineItem.cantidad,
          precio_unitario: lineItem.precio_unitario,
          subtotal: lineItem.subtotal,
        }),
      });
    }

    // Send email notifications
    const user = locals.user;
    const userName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Cliente";
    const userEmail = user.email;
    const userPhone = user.telefono || "";
    const userCompany = user.razon_social || "";
    const companyEmail = await getCompanyEmail();

    const emailItemsData = presupuestoItems.map((i) => ({
      nombre: i.nombre_producto,
      sku: i.sku,
      cantidad: i.cantidad,
      precioUnitario: i.precio_unitario,
      formato: i.formato,
    }));

    // Build separate emails with context-specific CTAs
    const adminHtml = buildPresupuestoHtml({
      presupuestoId,
      userName, userEmail, userPhone, userCompany,
      items: emailItemsData,
      subtotal,
      cta: { label: "Ver en el panel de gestion", url: "https://tienda.alcora.es/gestion/pedidos" },
    });

    const clientHtml = buildPresupuestoHtml({
      presupuestoId,
      userName, userEmail, userPhone, userCompany,
      items: emailItemsData,
      subtotal,
      cta: { label: "Ver mis presupuestos", url: "https://tienda.alcora.es/cuenta/pedidos" },
    });

    // Send to company
    try {
      await sendMail({
        to: companyEmail,
        subject: `Presupuesto #${presupuestoId} - ${userCompany || userName}`,
        html: adminHtml,
        replyTo: userEmail,
      });
    } catch (emailErr) {
      console.error("Error sending presupuesto notification to company:", emailErr);
    }

    // Send copy to client
    try {
      await sendMail({
        to: userEmail,
        subject: `Su presupuesto #${presupuestoId} - Alcora Salud Ambiental`,
        html: clientHtml,
        replyTo: companyEmail,
      });
    } catch (emailErr) {
      console.error("Error sending presupuesto copy to client:", emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        presupuestoId,
        message: "Solicitud de presupuesto enviada correctamente",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : "Unknown";
    console.error("Presupuesto error:", errorMsg);
    return new Response(
      JSON.stringify({ error: `Error al enviar la solicitud: ${errorMsg}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
