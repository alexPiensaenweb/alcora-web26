import { directusAdmin } from '../../../../chunks/directus_tOieuaro.mjs';
export { renderers } from '../../../../renderers.mjs';

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
  const VALID_STATUS = ["active", "suspended", "invited", "draft"];
  if (!VALID_STATUS.includes(body.status)) {
    return new Response(JSON.stringify({ error: "Status inválido" }), { status: 400 });
  }
  if (id === locals.user.id) {
    return new Response(JSON.stringify({ error: "No puedes modificar tu propio estado" }), { status: 400 });
  }
  try {
    await directusAdmin(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: body.status })
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[api/admin/usuarios/estado]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500 }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  PATCH
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
