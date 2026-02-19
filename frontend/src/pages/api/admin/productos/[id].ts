import type { APIRoute } from "astro";
import { directusAdmin } from "../../../../lib/directus";

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
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }

  // Campos permitidos para editar
  const ALLOWED = ["sku", "nombre", "precio_base", "stock", "formato", "unidad_venta", "status", "extracto", "descripcion"];
  const payload: Record<string, any> = {};
  for (const key of ALLOWED) {
    if (key in body) payload[key] = body[key];
  }

  if (Object.keys(payload).length === 0) {
    return new Response(JSON.stringify({ error: "Sin campos para actualizar" }), { status: 400 });
  }

  try {
    const res = await directusAdmin(`/items/productos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    return new Response(JSON.stringify({ ok: true, data: res.data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/admin/productos/id]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500 }
    );
  }
};
