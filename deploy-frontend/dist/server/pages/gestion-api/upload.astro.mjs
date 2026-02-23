export { renderers } from '../../renderers.mjs';

const POST = async ({ request, locals }) => {
  if (!locals.user?.isAdmin) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://127.0.0.1:8055";
  const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || "migration-static-token-alcora-2026";
  try {
    const formData = await request.formData();
    const res = await fetch(`${DIRECTUS_URL}/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`
      },
      body: formData
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[gestion-api/upload] Directus error:", res.status, text);
      throw new Error(`Error al subir archivo: ${res.status}`);
    }
    const data = await res.json();
    return new Response(JSON.stringify({ ok: true, data: data.data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[gestion-api/upload]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error al subir archivo" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
