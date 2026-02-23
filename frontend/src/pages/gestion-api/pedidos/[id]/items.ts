import type { APIRoute } from "astro";
import { directusAdmin, purgeDirectusCache } from "../../../../lib/directus";

/**
 * Admin API for managing presupuesto items (add/update/remove/bulk_discount).
 * Only allowed when pedido.tipo === "presupuesto".
 *
 * PATCH /gestion-api/pedidos/[id]/items
 * Body: { action: "update", itemId: number, data: { cantidad?, precio_unitario? } }
 *     | { action: "add", data: { producto: string, cantidad: number } }
 *     | { action: "remove", itemId: number }
 *     | { action: "bulk_discount", percent: number }   // applies % discount to all items
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user?.isAdmin) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "ID requerido" }), { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body invalido" }), { status: 400 });
  }

  const { action } = body;
  if (!["update", "add", "remove", "bulk_discount"].includes(action)) {
    return new Response(JSON.stringify({ error: "Action invalida: update|add|remove|bulk_discount" }), { status: 400 });
  }

  try {
    // Verify this is a presupuesto
    const pedidoRes = await directusAdmin(`/items/pedidos/${id}?fields=id,tipo`);
    const pedido = pedidoRes.data;
    if (!pedido) {
      return new Response(JSON.stringify({ error: "Presupuesto no encontrado" }), { status: 404 });
    }
    if (pedido.tipo !== "presupuesto") {
      return new Response(JSON.stringify({ error: "Solo se pueden editar items de presupuestos" }), { status: 400 });
    }

    if (action === "update") {
      const { itemId, data } = body;
      if (!itemId) {
        return new Response(JSON.stringify({ error: "itemId requerido" }), { status: 400 });
      }

      const updateData: any = {};
      if (data.cantidad != null) {
        const cant = Number(data.cantidad);
        if (!Number.isInteger(cant) || cant < 1 || cant > 10000) {
          return new Response(JSON.stringify({ error: "Cantidad invalida" }), { status: 400 });
        }
        updateData.cantidad = cant;
      }
      if (data.precio_unitario != null) {
        const precio = Number(data.precio_unitario);
        if (isNaN(precio) || precio < 0) {
          return new Response(JSON.stringify({ error: "Precio invalido" }), { status: 400 });
        }
        updateData.precio_unitario = Math.round(precio * 100) / 100;
      }

      // Fetch current item to compute subtotal
      const itemRes = await directusAdmin(`/items/pedidos_items/${itemId}?fields=id,pedido,cantidad,precio_unitario`);
      const currentItem = itemRes.data;
      if (!currentItem || String(currentItem.pedido) !== String(id)) {
        return new Response(JSON.stringify({ error: "Item no pertenece a este presupuesto" }), { status: 400 });
      }

      const finalCant = updateData.cantidad ?? currentItem.cantidad;
      const finalPrecio = updateData.precio_unitario ?? currentItem.precio_unitario;
      updateData.subtotal = Math.round(finalCant * finalPrecio * 100) / 100;

      await directusAdmin(`/items/pedidos_items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

    } else if (action === "add") {
      const { data } = body;
      if (!data?.producto || !data?.cantidad) {
        return new Response(JSON.stringify({ error: "producto y cantidad requeridos" }), { status: 400 });
      }

      const cant = Number(data.cantidad);
      if (!Number.isInteger(cant) || cant < 1 || cant > 10000) {
        return new Response(JSON.stringify({ error: "Cantidad invalida" }), { status: 400 });
      }

      // Fetch product details
      const prodRes = await directusAdmin(
        `/items/productos/${encodeURIComponent(data.producto)}?fields=id,nombre,sku,precio_base`
      );
      const product = prodRes.data;
      if (!product) {
        return new Response(JSON.stringify({ error: "Producto no encontrado" }), { status: 404 });
      }

      const precioUnitario = data.precio_unitario != null
        ? Math.round(Number(data.precio_unitario) * 100) / 100
        : product.precio_base;
      const lineSubtotal = Math.round(precioUnitario * cant * 100) / 100;

      await directusAdmin("/items/pedidos_items", {
        method: "POST",
        body: JSON.stringify({
          pedido: Number(id),
          producto: product.id,
          nombre_producto: product.nombre,
          sku: product.sku,
          cantidad: cant,
          precio_unitario: precioUnitario,
          subtotal: lineSubtotal,
        }),
      });

    } else if (action === "remove") {
      const { itemId } = body;
      if (!itemId) {
        return new Response(JSON.stringify({ error: "itemId requerido" }), { status: 400 });
      }

      // Verify item belongs to this presupuesto
      const itemRes = await directusAdmin(`/items/pedidos_items/${itemId}?fields=id,pedido`);
      const item = itemRes.data;
      if (!item || String(item.pedido) !== String(id)) {
        return new Response(JSON.stringify({ error: "Item no pertenece a este presupuesto" }), { status: 400 });
      }

      await directusAdmin(`/items/pedidos_items/${itemId}`, {
        method: "DELETE",
      });

    } else if (action === "bulk_discount") {
      const percent = Number(body.percent);
      if (isNaN(percent) || percent < 0 || percent > 100) {
        return new Response(JSON.stringify({ error: "Porcentaje invalido (0-100)" }), { status: 400 });
      }

      const factor = 1 - percent / 100;
      const itemsRes = await directusAdmin(
        `/items/pedidos_items?filter[pedido][_eq]=${id}&fields=id,cantidad,precio_unitario`
      );
      const items = itemsRes.data || [];

      for (const it of items) {
        const newPrice = Math.round(Number(it.precio_unitario) * factor * 100) / 100;
        const newSubtotal = Math.round(newPrice * Number(it.cantidad) * 100) / 100;
        await directusAdmin(`/items/pedidos_items/${it.id}`, {
          method: "PATCH",
          body: JSON.stringify({ precio_unitario: newPrice, subtotal: newSubtotal }),
        });
      }
    }

    // Recalculate presupuesto totals
    const allItemsRes = await directusAdmin(
      `/items/pedidos_items?filter[pedido][_eq]=${id}&fields=subtotal`
    );
    const allItems = allItemsRes.data || [];
    const newSubtotal = Math.round(
      allItems.reduce((sum: number, i: any) => sum + Number(i.subtotal || 0), 0) * 100
    ) / 100;

    await directusAdmin(`/items/pedidos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        subtotal: newSubtotal,
        total: newSubtotal, // presupuestos don't have shipping
      }),
    });

    await purgeDirectusCache();

    return new Response(
      JSON.stringify({ ok: true, subtotal: newSubtotal, total: newSubtotal }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[api/admin/pedidos/items]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
