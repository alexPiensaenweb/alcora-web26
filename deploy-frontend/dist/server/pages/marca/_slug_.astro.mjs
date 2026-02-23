/* empty css                                          */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, u as unescapeHTML, h as addAttribute, m as maybeRenderHead } from '../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$CatalogLayout, I as InfiniteProductGrid } from '../../chunks/InfiniteProductGrid_DaFANy-N.mjs';
import { getMarcaBySlug, getProductos, getTarifasForGrupo, getAssetUrl, getPublicAssetUrl } from '../../chunks/directus_tOieuaro.mjs';
import { r as resolveDiscount, c as calculatePrice } from '../../chunks/pricing_CdYilCUq.mjs';
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://tienda.alcora.es");
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  let marca;
  try {
    marca = await getMarcaBySlug(slug);
  } catch (error) {
    console.error("[marca] Error fetching marca:", error);
  }
  if (!marca) {
    return Astro2.redirect("/catalogo");
  }
  const limit = 24;
  let products = [];
  let meta = { total_count: 0 };
  try {
    const result = await getProductos({
      marcaId: marca.id,
      page: 1,
      limit
    });
    products = result.data;
    meta = result.meta;
  } catch (error) {
    console.error("[marca] Error fetching products for marca:", error);
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
  const apiUrl = `/products-api?limit=${limit}&marca_id=${marca.id}`;
  const totalProducts = meta?.total_count || 0;
  const siteUrl = process.env.PUBLIC_SITE_URL || "https://tienda.alcora.es";
  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: marca.nombre,
    url: `${siteUrl}/marca/${marca.slug}`,
    ...marca.logo ? { logo: getPublicAssetUrl(marca.logo) } : {},
    ...marca.web ? { sameAs: marca.web } : {}
  };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Productos ${marca.nombre} - Alcora Salud Ambiental`,
    description: `Catálogo de productos profesionales ${marca.nombre} para control de plagas, desinfección e higiene ambiental. Distribuidor oficial.`,
    url: `${siteUrl}/marca/${marca.slug}`,
    numberOfItems: totalProducts,
    provider: {
      "@type": "Organization",
      name: "Alcora Salud Ambiental",
      url: siteUrl
    }
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Marcas", item: `${siteUrl}/marcas` },
      { "@type": "ListItem", position: 3, name: marca.nombre, item: `${siteUrl}/marca/${marca.slug}` }
    ]
  };
  return renderTemplate`${renderComponent($$result, "CatalogLayout", $$CatalogLayout, { "title": `${marca.nombre} - Productos profesionales | Tienda Alcora`, "description": `Catálogo completo de productos ${marca.nombre} para profesionales del control de plagas, desinfección e higiene ambiental. ${totalProducts} productos disponibles. Distribuidor oficial.`, "breadcrumbs": [
    { label: "Marcas", href: "/marcas" },
    { label: marca.nombre }
  ], "sidebarMode": "root" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div>  <div class="flex items-start gap-5 mb-6"> ', ' <div class="flex-1"> <h1 class="text-xl font-bold text-navy">Productos ', '</h1> <p class="text-sm text-text-muted mt-1"> ', " productos profesionales disponibles\n</p> ", ' </div> </div>  <div class="prose prose-sm max-w-none text-text-muted mb-6"> <p>\nDistribuimos toda la gama de productos <strong>', "</strong> para profesionales\n        del sector de la sanidad ambiental, control de plagas y limpieza profesional. Como distribuidor\n        oficial, garantizamos producto original, stock inmediato y las mejores condiciones para empresas.\n</p> </div> ", ' </div> <script type="application/ld+json">', '</script> <script type="application/ld+json">', '</script> <script type="application/ld+json">', "</script> "])), maybeRenderHead(), marca.logo && renderTemplate`<div class="w-20 h-20 bg-white border border-border rounded-xl p-2 flex-shrink-0 flex items-center justify-center"> <img${addAttribute(getPublicAssetUrl(marca.logo), "src")}${addAttribute(`Logo ${marca.nombre}`, "alt")} class="max-w-full max-h-full object-contain"> </div>`, marca.nombre, totalProducts, marca.web && renderTemplate`<a${addAttribute(marca.web, "href")} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs text-action hover:underline mt-2">
Sitio web oficial
<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(2, "stroke-width")} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path> </svg> </a>`, marca.nombre, renderComponent($$result2, "InfiniteProductGrid", InfiniteProductGrid, { "client:load": true, "apiUrl": apiUrl, "initialItems": initialItems, "initialPage": 1, "initialHasMore": totalProducts > limit, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/catalog/InfiniteProductGrid", "client:component-export": "default" }), unescapeHTML(JSON.stringify(brandSchema)), unescapeHTML(JSON.stringify(collectionSchema)), unescapeHTML(JSON.stringify(breadcrumbSchema))) })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/marca/[slug].astro", void 0);
const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/marca/[slug].astro";
const $$url = "/marca/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
