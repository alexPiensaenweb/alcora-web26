import type { APIRoute } from "astro";
import { directusAdmin } from "../../../lib/directus";

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user?.isAdmin) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validar campos requeridos
  if (!body.sku || !body.nombre || !body.precio_base) {
    return new Response(
      JSON.stringify({ error: "SKU, nombre y precio base son obligatorios" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Generar slug si no viene
  const slug =
    body.slug ||
    body.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const payload: Record<string, any> = {
    sku: body.sku,
    nombre: body.nombre,
    slug,
    precio_base: Number(body.precio_base),
    status: body.status || "draft",
    stock: body.stock != null ? Number(body.stock) : -1,
    extracto: body.extracto || null,
    descripcion: body.descripcion || null,
    formato: body.formato || null,
    unidad_venta: body.unidad_venta || null,
    marca: body.marca || null,
    categoria: body.categoria || null,
    marca_id: body.marca_id || null,
    imagen_principal: body.imagen_principal || null,
    ficha_tecnica: body.ficha_tecnica || null,
    ficha_seguridad: body.ficha_seguridad || null,
  };

  try {
    const res = await directusAdmin("/items/productos", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return new Response(
      JSON.stringify({ ok: true, data: res.data }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[gestion-api/productos/crear]", err);

    // Check for unique constraint violation (duplicate SKU/slug)
    const msg = err.message || "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return new Response(
        JSON.stringify({ error: "Ya existe un producto con ese SKU o slug" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: err.message || "Error al crear producto" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
