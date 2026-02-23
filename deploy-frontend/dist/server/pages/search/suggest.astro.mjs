import { directusPublic, getPublicAssetUrl } from '../../chunks/directus_tOieuaro.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  try {
    const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
    if (q.length < 2) {
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const res = await directusPublic(
      `/items/productos?filter[status][_eq]=published&search=${encodeURIComponent(
        q
      )}&fields=nombre,slug,sku,imagen_principal,marca,marca_id.nombre&sort=nombre&limit=8`
    );
    const items = (res.data || []).map((item) => ({
      nombre: item.nombre,
      slug: item.slug,
      sku: item.sku,
      imagen_principal: item.imagen_principal || null,
      imageUrl: item.imagen_principal ? getPublicAssetUrl(item.imagen_principal) : null,
      marca: item.marca_id?.nombre || item.marca || null
    }));
    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Search suggest error:", error instanceof Error ? error.message : "Unknown");
    return new Response(
      JSON.stringify({ items: [] }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
