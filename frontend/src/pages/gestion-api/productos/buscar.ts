import type { APIRoute } from "astro";
import { directusAdmin } from "../../../lib/directus";

/**
 * GET /gestion-api/productos/buscar?q=texto
 * Searches products by SKU or name for admin use (presupuesto management).
 * Returns max 10 results with id, sku, nombre, precio_base, imagen_principal.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.user?.isAdmin) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const q = url.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Search by SKU (exact prefix) or name (contains)
    const res = await directusAdmin(
      `/items/productos?filter[status][_eq]=published&filter[_or][0][sku][_icontains]=${encodeURIComponent(q)}&filter[_or][1][nombre][_icontains]=${encodeURIComponent(q)}&fields=id,sku,nombre,precio_base,imagen_principal,formato&sort=nombre&limit=10`
    );

    return new Response(JSON.stringify({ data: res.data || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/productos/buscar]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error buscando productos" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
