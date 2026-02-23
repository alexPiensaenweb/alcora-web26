import { directusAdmin } from '../../../chunks/directus_tOieuaro.mjs';
export { renderers } from '../../../renderers.mjs';

function slugify(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
const POST = async ({ request, locals }) => {
  if (!locals.user?.isAdmin) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }
  const { sku, nombre, precio_base, stock, extracto, descripcion, formato, unidad_venta, categoria_nombre, marca_nombre } = body;
  if (!sku || !nombre) {
    return new Response(JSON.stringify({ error: "SKU y nombre son obligatorios" }), { status: 400 });
  }
  try {
    const existing = await directusAdmin(`/items/productos?filter[sku][_eq]=${encodeURIComponent(sku)}&fields=id&limit=1`);
    const payload = {
      sku,
      nombre,
      slug: slugify(nombre),
      precio_base: parseFloat(precio_base) || 0,
      stock: parseInt(stock) || 0,
      status: "draft"
      // Import as draft by default
    };
    if (extracto) payload.extracto = extracto;
    if (descripcion) payload.descripcion = descripcion;
    if (formato) payload.formato = formato;
    if (unidad_venta) payload.unidad_venta = unidad_venta;
    if (categoria_nombre) {
      try {
        const catRes = await directusAdmin(
          `/items/categorias?filter[nombre][_icontains]=${encodeURIComponent(categoria_nombre.trim())}&fields=id&limit=1`
        );
        if (catRes.data?.[0]?.id) {
          payload.categoria = catRes.data[0].id;
        }
      } catch {
      }
    }
    if (marca_nombre) {
      try {
        const marcaRes = await directusAdmin(
          `/items/marcas?filter[nombre][_icontains]=${encodeURIComponent(marca_nombre.trim())}&fields=id&limit=1`
        );
        if (marcaRes.data?.[0]?.id) {
          payload.marca_id = marcaRes.data[0].id;
        }
      } catch {
      }
    }
    let result;
    if (existing.data?.length > 0) {
      const existingId = existing.data[0].id;
      result = await directusAdmin(`/items/productos/${existingId}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
    } else {
      result = await directusAdmin("/items/productos", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
    return new Response(JSON.stringify({ ok: true, data: result.data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[api/admin/productos/importar]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500 }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
