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
  const VALID_ESTADOS = [
    "solicitado",
    "presupuesto_solicitado",
    "aprobado_pendiente_pago",
    "pagado",
    "enviado",
    "cancelado"
  ];
  if (!VALID_ESTADOS.includes(body.estado)) {
    return new Response(JSON.stringify({ error: "Estado inválido" }), { status: 400 });
  }
  try {
    await directusAdmin(`/items/pedidos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ estado: body.estado })
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[api/admin/pedidos/estado]", err);
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
