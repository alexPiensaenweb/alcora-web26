import type { APIRoute } from "astro";
import { directusAdmin, purgeDirectusCache } from "../../../../lib/directus";
import { validateSchema, pedidoEstadoSchema } from "../../../../lib/schemas";

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

  const validation = validateSchema(pedidoEstadoSchema, body);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
  }

  try {
    await directusAdmin(`/items/pedidos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ estado: body.estado }),
    });

    await purgeDirectusCache();

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/admin/pedidos/estado]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500 }
    );
  }
};
