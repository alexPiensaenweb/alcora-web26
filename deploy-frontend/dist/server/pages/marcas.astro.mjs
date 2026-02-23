/* empty css                                       */
import { f as createComponent, k as renderComponent, r as renderTemplate, u as unescapeHTML, h as addAttribute, m as maybeRenderHead } from '../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BgOPDYG0.mjs';
import { getMarcas, getPublicAssetUrl } from '../chunks/directus_tOieuaro.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Marcas = createComponent(async ($$result, $$props, $$slots) => {
  let marcas = [];
  try {
    marcas = await getMarcas();
  } catch (error) {
    console.error("[marcas] Error fetching marcas:", error);
  }
  const siteUrl = process.env.PUBLIC_SITE_URL || "https://tienda.alcora.es";
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Marcas profesionales - Alcora Salud Ambiental",
    description: "Catálogo de marcas de productos profesionales para control de plagas, desinfección e higiene ambiental. Distribuidor oficial.",
    url: `${siteUrl}/marcas`,
    numberOfItems: marcas.length,
    provider: {
      "@type": "Organization",
      name: "Alcora Salud Ambiental",
      url: siteUrl
    }
  };
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Marcas profesionales - Tienda Alcora", "description": "Descubre todas las marcas de productos profesionales para control de plagas, desinfección, limpieza e higiene ambiental que distribuimos. Stock inmediato y condiciones para empresas." }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">  <nav class="text-sm text-text-muted mb-6" aria-label="Breadcrumb"> <ol class="flex items-center gap-2" itemscope itemtype="https://schema.org/BreadcrumbList"> <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"> <a href="/" itemprop="item" class="hover:text-action"><span itemprop="name">Inicio</span></a> <meta itemprop="position" content="1"> </li> <li class="text-border">/</li> <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"> <span itemprop="name" class="font-medium text-navy">Marcas</span> <meta itemprop="position" content="2"> </li> </ol> </nav>  <div class="mb-8"> <h1 class="text-2xl font-bold text-navy mb-2">Nuestras marcas</h1> <p class="text-text-muted max-w-2xl">\nTrabajamos con los principales fabricantes del sector para ofrecer productos de\n        máxima calidad para profesionales del control de plagas, desinfección y limpieza industrial.\n</p> </div>  ', '  <div class="mt-12 prose prose-sm max-w-none text-text-muted"> <h2 class="text-lg font-semibold text-navy">Distribuidor de marcas profesionales para sanidad ambiental</h2> <p>\nEn Alcora Salud Ambiental somos distribuidores oficiales de las principales marcas\n        de productos para control de plagas, desinfección, limpieza profesional e higiene ambiental.\n        Ofrecemos stock inmediato, precios competitivos y asesoramiento técnico especializado para\n        empresas del sector en toda España.\n</p> </div> </div> <script type="application/ld+json">', "</script> "])), maybeRenderHead(), marcas.length > 0 ? renderTemplate`<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"> ${marcas.map((marca) => renderTemplate`<a${addAttribute(`/marca/${marca.slug}`, "href")} class="group bg-white border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-action hover:shadow-md transition-all"> ${marca.logo ? renderTemplate`<div class="w-24 h-16 flex items-center justify-center mb-3"> <img${addAttribute(getPublicAssetUrl(marca.logo), "src")}${addAttribute(`Logo ${marca.nombre}`, "alt")} class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" loading="lazy"> </div>` : renderTemplate`<div class="w-24 h-16 flex items-center justify-center mb-3 bg-bg-light rounded-lg"> <span class="text-lg font-bold text-navy/40">${marca.nombre.charAt(0)}</span> </div>`} <span class="text-sm font-semibold text-navy group-hover:text-action transition-colors"> ${marca.nombre} </span> </a>`)} </div>` : renderTemplate`<div class="text-center py-12 text-text-muted"> <p>No hay marcas disponibles en este momento.</p> </div>`, unescapeHTML(JSON.stringify(pageSchema))) })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/marcas.astro", void 0);
const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/marcas.astro";
const $$url = "/marcas";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Marcas,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
