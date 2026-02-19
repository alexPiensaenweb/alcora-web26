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

  const VALID_STATUS = ["active", "suspended", "invited", "draft"];
  if (!VALID_STATUS.includes(body.status)) {
    return new Response(JSON.stringify({ error: "Status inválido" }), { status: 400 });
  }

  // No permitir modificar al propio usuario admin
  if (id === locals.user.id) {
    return new Response(JSON.stringify({ error: "No puedes modificar tu propio estado" }), { status: 400 });
  }

  try {
    await directusAdmin(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: body.status }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/admin/usuarios/estado]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500 }
    );
  }
};
