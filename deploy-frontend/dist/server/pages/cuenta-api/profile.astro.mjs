import { directusAuth } from '../../chunks/directus_tOieuaro.mjs';
export { renderers } from '../../renderers.mjs';

const PATCH = async ({ request, locals }) => {
  try {
    if (!locals.user || !locals.token) {
      return new Response(
        JSON.stringify({ error: "No autenticado" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const body = await request.json();
    const allowedFields = [
      "first_name",
      "last_name",
      "telefono",
      "direccion_facturacion",
      "direccion_envio"
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }
    await directusAuth(`/users/me`, locals.token, {
      method: "PATCH",
      body: JSON.stringify(updates)
    });
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Profile update error:", err instanceof Error ? err.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Error al actualizar perfil" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  PATCH
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
