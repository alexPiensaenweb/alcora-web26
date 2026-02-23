/* empty css                                          */
import { e as createAstro, f as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, u as unescapeHTML, h as addAttribute, m as maybeRenderHead } from '../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_BgOPDYG0.mjs';
import { $ as $$Breadcrumb } from '../../chunks/Breadcrumb_Q93TwQUq.mjs';
import { getProductoBySlug, getTarifasForGrupo, getAssetUrl } from '../../chunks/directus_tOieuaro.mjs';
import { s as sanitizeHtml } from '../../chunks/sanitize_BunHQEFD.mjs';
import { r as resolveDiscount, c as calculatePrice, f as formatCurrency } from '../../chunks/pricing_CdYilCUq.mjs';
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
  let product;
  try {
    product = await getProductoBySlug(slug);
  } catch (error) {
    console.error("[catalogo/slug] Error fetching product:", error);
  }
  if (!product) {
    return Astro2.redirect("/catalogo");
  }
  const user = Astro2.locals.user;
  const token = Astro2.locals.token;
  let finalPrice = null;
  let descuento = 0;
  if (user?.grupo_cliente && token) {
    const tarifas = await getTarifasForGrupo(user.grupo_cliente);
    const categoriaId = typeof product.categoria === "object" ? product.categoria?.id : product.categoria;
    descuento = resolveDiscount(tarifas, product.id, categoriaId);
    finalPrice = calculatePrice(product.precio_base, descuento);
  }
  const imageUrl = getAssetUrl(product.imagen_principal);
  const categoria = product.categoria;
  const marcaNombre = typeof product.marca_id === "object" && product.marca_id ? product.marca_id.nombre : product.marca;
  const breadcrumbs = [];
  if (categoria) {
    breadcrumbs.push({ label: categoria.nombre, href: `/categoria/${categoria.slug}` });
  }
  breadcrumbs.push({ label: product.nombre });
  const siteUrl = process.env.PUBLIC_SITE_URL || "https://tienda.alcora.es";
  const marcaObj = typeof product.marca_id === "object" && product.marca_id ? product.marca_id : null;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nombre,
    description: product.extracto || product.descripcion?.replace(/<[^>]+>/g, "").slice(0, 200) || `${product.nombre} - producto profesional`,
    sku: product.sku,
    url: `${siteUrl}/catalogo/${product.slug}`,
    ...product.imagen_principal ? { image: getAssetUrl(product.imagen_principal) } : {},
    ...marcaNombre ? { brand: { "@type": "Brand", name: marcaNombre } } : {},
    ...categoria ? { category: categoria.nombre } : {},
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      availability: product.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Alcora Salud Ambiental"
      }
    }
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Catalogo", item: `${siteUrl}/catalogo` },
      ...categoria ? [{
        "@type": "ListItem",
        position: 3,
        name: categoria.nombre,
        item: `${siteUrl}/categoria/${categoria.slug}`
      }] : [],
      {
        "@type": "ListItem",
        position: categoria ? 4 : 3,
        name: product.nombre,
        item: `${siteUrl}/catalogo/${product.slug}`
      }
    ]
  };
  const seoDescription = product.extracto || product.descripcion?.replace(/<[^>]+>/g, "").slice(0, 155) || `${product.nombre} - Comprar online para profesionales. ${marcaNombre ? `Marca ${marcaNombre}.` : ""} Stock inmediato - Alcora Salud Ambiental`;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": `${product.nombre}${marcaNombre ? ` - ${marcaNombre}` : ""} | Tienda Alcora`, "description": seoDescription, "ogImage": product.imagen_principal ? getAssetUrl(product.imagen_principal) : void 0 }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> ', ' <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">  <div class="bg-bg-light rounded-lg p-8 flex items-center justify-center"> ', ' </div>  <div> <p class="text-sm text-text-muted mb-1">SKU: ', "</p> ", ' <h1 class="text-2xl font-bold text-navy mb-4">', "</h1> ", " ", '  <div class="border-t border-b border-border py-4 my-4"> ', " </div>  ", '  <div class="space-y-2"> ', " ", ' </div>  <div class="mt-4"> ', " </div> </div> </div>  ", ' </div> <script type="application/ld+json">', '</script> <script type="application/ld+json">', "</script> "])), maybeRenderHead(), renderComponent($$result2, "Breadcrumb", $$Breadcrumb, { "items": breadcrumbs }), product.imagen_principal ? renderTemplate`<img${addAttribute(imageUrl, "src")}${addAttribute(product.nombre, "alt")} class="max-w-full max-h-[500px] object-contain">` : renderTemplate`<div class="text-border"> <svg class="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path> </svg> </div>`, product.sku, marcaNombre && renderTemplate`<p class="text-xs font-semibold text-action/80 uppercase tracking-wide mb-1"> ${marcaObj ? renderTemplate`<a${addAttribute(`/marca/${marcaObj.slug}`, "href")} class="hover:underline">${marcaNombre}</a>` : marcaNombre} </p>`, product.nombre, product.formato && renderTemplate`<p class="text-sm text-text-muted mb-2"> <strong>Formato:</strong> ${product.formato} </p>`, product.unidad_venta && renderTemplate`<p class="text-sm text-text-muted mb-4"> <strong>Unidad de venta:</strong> ${product.unidad_venta} </p>`, finalPrice !== null ? renderTemplate`<div> ${descuento > 0 && renderTemplate`<p class="text-sm text-text-muted line-through">
PVP: ${formatCurrency(product.precio_base)} </p>`} <p class="text-3xl font-bold text-action"> ${formatCurrency(finalPrice)} </p> ${descuento > 0 && renderTemplate`<span class="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
-${descuento}% dto. ${user?.grupo_cliente} </span>`} </div>` : renderTemplate`<div class="bg-bg-accent p-4 rounded-lg"> <p class="text-sm text-navy font-medium"> <a href="/login" class="text-action hover:underline">Acceda a su cuenta</a> ${" "}para ver precios y realizar pedidos.
</p> <p class="text-xs text-text-muted mt-1">
No tiene cuenta? <a href="/registro" class="text-action hover:underline">Solicite acceso</a> </p> </div>`, finalPrice !== null && renderTemplate`<div class="mb-6" id="add-to-cart-section"${addAttribute(product.id, "data-product-id")}${addAttribute(product.nombre, "data-product-name")}${addAttribute(product.sku, "data-product-sku")}${addAttribute(product.slug, "data-product-slug")}${addAttribute(product.imagen_principal || "", "data-product-image")}${addAttribute(finalPrice, "data-product-price")}${addAttribute(product.formato || "", "data-product-formato")}> <div class="flex items-center gap-3"> <div class="flex items-center border border-border rounded-lg"> <button id="qty-minus" class="px-3 py-2 text-navy hover:bg-bg-light transition-colors">-</button> <input id="qty-input" type="number" value="1" min="1" class="w-16 text-center py-2 border-x border-border text-sm"> <button id="qty-plus" class="px-3 py-2 text-navy hover:bg-bg-light transition-colors">+</button> </div> <button id="btn-add-cart" class="flex-1 bg-action text-white py-2.5 rounded-lg text-sm font-medium hover:bg-action-hover transition-colors">
Anadir al carrito
</button> </div> </div>`, product.ficha_tecnica && renderTemplate`<a${addAttribute(getAssetUrl(product.ficha_tecnica), "href")} target="_blank" rel="noopener" class="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm text-navy hover:bg-bg-light transition-colors"> <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"> <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path> </svg>
Descargar Ficha Técnica (PDF)
</a>`, product.ficha_seguridad && renderTemplate`<a${addAttribute(getAssetUrl(product.ficha_seguridad), "href")} target="_blank" rel="noopener" class="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm text-navy hover:bg-bg-light transition-colors"> <svg class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20"> <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path> </svg>
Descargar Ficha de Seguridad (PDF)
</a>`, product.stock === 0 ? renderTemplate`<span class="text-sm text-red-600 font-medium">Sin stock</span>` : product.stock > 0 ? renderTemplate`<span class="text-sm text-green-600 font-medium">En stock (${product.stock} uds)</span>` : renderTemplate`<span class="text-sm text-green-600 font-medium">Disponible</span>`, product.descripcion && renderTemplate`<div class="mt-12 border-t border-border pt-8"> <h2 class="text-lg font-bold text-navy mb-4">Descripcion</h2> <div class="prose prose-sm max-w-none text-text-muted">${unescapeHTML(sanitizeHtml(product.descripcion))}</div> </div>`, unescapeHTML(JSON.stringify(productSchema)), unescapeHTML(JSON.stringify(breadcrumbSchema))) })} ${renderScript($$result, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/catalogo/[slug].astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/catalogo/[slug].astro", void 0);
const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/catalogo/[slug].astro";
const $$url = "/catalogo/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
