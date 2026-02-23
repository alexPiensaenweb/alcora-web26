/* empty css                                       */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$CatalogLayout, I as InfiniteProductGrid } from '../chunks/InfiniteProductGrid_DaFANy-N.mjs';
import { getProductos, getTarifasForGrupo, getAssetUrl } from '../chunks/directus_tOieuaro.mjs';
import { r as resolveDiscount, c as calculatePrice } from '../chunks/pricing_CdYilCUq.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const url = Astro2.url;
  const search = url.searchParams.get("search") || "";
  const limit = 24;
  let products = [];
  let meta = { total_count: 0 };
  try {
    const result = await getProductos({ page: 1, limit, search });
    products = result.data;
    meta = result.meta;
  } catch (error) {
    console.error("[catalogo] Error fetching products:", error);
  }
  const user = Astro2.locals.user;
  const token = Astro2.locals.token;
  let tarifas = [];
  if (user?.grupo_cliente && token) {
    tarifas = await getTarifasForGrupo(user.grupo_cliente);
  }
  const initialItems = products.map((product) => {
    const categoriaId = typeof product.categoria === "object" ? product.categoria?.id : product.categoria;
    let price = null;
    if (user) {
      if (tarifas.length > 0) {
        const descuento = resolveDiscount(tarifas, product.id, categoriaId || null);
        price = calculatePrice(product.precio_base, descuento);
      } else {
        price = product.precio_base;
      }
    }
    return {
      id: product.id,
      sku: product.sku,
      nombre: product.nombre,
      slug: product.slug,
      extracto: product.extracto || null,
      formato: product.formato || null,
      imageUrl: getAssetUrl(product.imagen_principal),
      price
    };
  });
  const apiUrl = `/products-api?limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  return renderTemplate`${renderComponent($$result, "CatalogLayout", $$CatalogLayout, { "title": "Catalogo - Tienda Alcora", "breadcrumbs": [{ label: "Catalogo" }], "sidebarMode": "root" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div> <div class="flex items-center justify-between mb-6"> <h1 class="text-xl font-bold text-navy"> ${search ? `Resultados para "${search}"` : "Todos los productos"} </h1> <span class="text-sm text-text-muted"> ${meta?.total_count || 0} productos
</span> </div> ${renderComponent($$result2, "InfiniteProductGrid", InfiniteProductGrid, { "client:load": true, "apiUrl": apiUrl, "initialItems": initialItems, "initialPage": 1, "initialHasMore": (meta?.total_count || 0) > limit, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/catalog/InfiniteProductGrid", "client:component-export": "default" })} </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/catalogo/index.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/catalogo/index.astro";
const $$url = "/catalogo";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
