import { directusAdmin } from '../../../chunks/directus_tOieuaro.mjs';
export { renderers } from '../../../renderers.mjs';

const PATCH = async ({ params, request, locals }) => {
  if (!locals.user?.isAdmin) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
  }
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "ID requerido" }), { status: 400 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }
  const ALLOWED = ["sku", "nombre", "precio_base", "stock", "formato", "unidad_venta", "status", "extracto", "descripcion"];
  const payload = {};
  for (const key of ALLOWED) {
    if (key in body) payload[key] = body[key];
  }
  if (Object.keys(payload).length === 0) {
    return new Response(JSON.stringify({ error: "Sin campos para actualizar" }), { status: 400 });
  }
  try {
    const res = await directusAdmin(`/items/productos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    return new Response(JSON.stringify({ ok: true, data: res.data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[api/admin/productos/id]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500 }
    );
  }
};
const DELETE = async ({ params, locals }) => {
  if (!locals.user?.isAdmin) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "ID requerido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    await directusAdmin(`/items/productos/${id}`, {
      method: "DELETE"
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[api/admin/productos/delete]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error al eliminar producto" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  PATCH
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
