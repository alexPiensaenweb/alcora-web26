/* empty css                                       */
import { e as createAstro, f as createComponent, m as maybeRenderHead, h as addAttribute, r as renderTemplate, k as renderComponent } from '../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$BaseLayout, f as $$CategoryIcon } from '../chunks/BaseLayout_BgOPDYG0.mjs';
import 'clsx';
import { getAssetUrl, getCategorias, getProductos, getTarifasForGrupo } from '../chunks/directus_tOieuaro.mjs';
import { f as formatCurrency, r as resolveDiscount, c as calculatePrice } from '../chunks/pricing_CdYilCUq.mjs';
import { f as formatCategoryName } from '../chunks/utils_BzKe2XRh.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro$1 = createAstro("https://tienda.alcora.es");
const $$ProductCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ProductCard;
  const { product, price } = Astro2.props;
  const imageUrl = getAssetUrl(product.imagen_principal);
  return renderTemplate`${maybeRenderHead()}<article class="bg-white border border-border rounded-lg overflow-hidden hover:shadow-card transition-shadow group"> <a${addAttribute(`/catalogo/${product.slug}`, "href")} class="block">  <div class="aspect-square bg-white border-b border-border overflow-hidden p-4 flex items-center justify-center"> ${product.imagen_principal ? renderTemplate`<img${addAttribute(imageUrl, "src")}${addAttribute(product.nombre, "alt")} class="w-full h-full object-contain" loading="lazy">` : renderTemplate`<div class="w-full h-full flex items-center justify-center text-text-muted"> <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path> </svg> </div>`} </div>  <div class="p-4"> <p class="text-xs text-text-muted mb-1">${product.sku}</p> <p class="text-sm font-semibold text-navy line-clamp-2 mb-2 group-hover:text-action transition-colors"> ${product.nombre} </p> ${product.extracto && renderTemplate`<p class="text-xs text-text-muted line-clamp-2 mb-3">${product.extracto}</p>`} ${product.formato && renderTemplate`<p class="text-xs text-text-muted mb-2">${product.formato}</p>`}  ${price !== void 0 && price !== null ? renderTemplate`<p class="text-lg font-bold text-action">${formatCurrency(price)}</p>` : renderTemplate`<p class="text-xs text-text-muted italic"> <a href="/login" class="text-action hover:underline">Acceda</a> para ver precios
</p>`} </div> </a> </article>`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/catalog/ProductCard.astro", void 0);

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  let categorias = [];
  try {
    categorias = await getCategorias();
  } catch (error) {
    console.error("[index] Error fetching categorias:", error);
  }
  const rootRaw = categorias.filter((c) => {
    const parentId = typeof c.parent === "object" ? c.parent?.id : c.parent;
    return !parentId;
  });
  const rootCategorias = rootRaw.filter((cat, index, all) => {
    const current = formatCategoryName(cat.nombre).toLowerCase();
    return all.findIndex(
      (candidate) => formatCategoryName(candidate.nombre).toLowerCase() === current
    ) === index;
  });
  let featuredProducts = [];
  try {
    const result = await getProductos({ limit: 8 });
    featuredProducts = result.data;
  } catch (error) {
    console.error("[index] Error fetching featured products:", error);
  }
  const user = Astro2.locals.user;
  const token = Astro2.locals.token;
  let tarifas = [];
  if (user?.grupo_cliente && token) {
    tarifas = await getTarifasForGrupo(user.grupo_cliente);
  }
  function subcategoryCount(categoryId) {
    return categorias.filter((cat) => {
      const parentId = typeof cat.parent === "object" ? cat.parent?.id : cat.parent;
      return parentId === categoryId;
    }).length;
  }
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Alcora Salud Ambiental - Tienda para Profesionales" }, { "default": async ($$result2) => renderTemplate`${maybeRenderHead()}<section class="relative text-white overflow-hidden"> <img src="/hero-bg.jpg" alt="" class="absolute inset-0 w-full h-full object-cover" loading="eager"> <div class="absolute inset-0 bg-gradient-to-r from-[#222d54]/90 via-[#222d54]/75 to-[#222d54]/60"></div> <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24"> <div class="max-w-2xl"> <h1 class="text-3xl lg:text-5xl font-bold leading-tight mb-4">
Productos profesionales de salud ambiental
</h1> <p class="text-lg text-white/80 mb-8">
Distribuidor oficial de productos de control de plagas, limpieza profesional,
          desinfección y equipos de protección. Precios exclusivos para profesionales.
</p> <div class="flex flex-wrap gap-3"> <a href="/catalogo" class="bg-action text-white px-6 py-3 rounded-lg font-medium hover:bg-action-hover transition-colors">
Ver catálogo
</a> ${!user && renderTemplate`<a href="/registro" class="border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
Solicitar acceso
</a>`} </div> </div> </div> </section> <section class="bg-bg-light border-b border-border"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"> <div class="flex items-center gap-3"> <div class="w-10 h-10 bg-bg-accent rounded-lg flex items-center justify-center flex-shrink-0"> <svg class="w-5 h-5 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path> </svg> </div> <div> <p class="text-sm font-semibold text-navy">Envío gratuito</p> <p class="text-xs text-text-muted">Pedidos superiores a 500€</p> </div> </div> <div class="flex items-center gap-3"> <div class="w-10 h-10 bg-bg-accent rounded-lg flex items-center justify-center flex-shrink-0"> <svg class="w-5 h-5 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path> </svg> </div> <div> <p class="text-sm font-semibold text-navy">Productos certificados</p> <p class="text-xs text-text-muted">Fichas técnicas disponibles</p> </div> </div> <div class="flex items-center gap-3"> <div class="w-10 h-10 bg-bg-accent rounded-lg flex items-center justify-center flex-shrink-0"> <svg class="w-5 h-5 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path> </svg> </div> <div> <p class="text-sm font-semibold text-navy">Precios exclusivos</p> <p class="text-xs text-text-muted">Descuentos por grupo de cliente</p> </div> </div> <div class="flex items-center gap-3"> <div class="w-10 h-10 bg-bg-accent rounded-lg flex items-center justify-center flex-shrink-0"> <svg class="w-5 h-5 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path> </svg> </div> <div> <p class="text-sm font-semibold text-navy">Atención personalizada</p> <p class="text-xs text-text-muted">Asesoramiento técnico</p> </div> </div> </div> </div> </section> <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"> <div class="text-center mb-8"> <h2 class="text-2xl font-bold text-navy">Categorías de producto</h2> <p class="text-sm text-text-muted mt-2">
Explore nuestra gama completa de productos profesionales
</p> </div> <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"> ${rootCategorias.map((cat) => {
    const subCount = subcategoryCount(cat.id);
    return renderTemplate`<a${addAttribute(`/categoria/${cat.slug}`, "href")} class="group relative bg-white border border-border rounded-xl p-5 text-center hover:border-action hover:shadow-lg transition-all duration-200"> <div class="w-14 h-14 mx-auto mb-3 rounded-xl bg-bg-accent flex items-center justify-center group-hover:bg-[#dbeaff] transition-colors"> ${cat.imagen ? renderTemplate`<img${addAttribute(getAssetUrl(cat.imagen), "src")}${addAttribute(formatCategoryName(cat.nombre), "alt")} class="w-10 h-10 object-contain">` : renderTemplate`${renderComponent($$result2, "CategoryIcon", $$CategoryIcon, { "slug": cat.slug, "className": "w-7 h-7 text-action" })}`} </div> <p class="text-sm font-semibold text-navy group-hover:text-action transition-colors leading-tight"> ${formatCategoryName(cat.nombre)} </p> ${subCount > 0 && renderTemplate`<p class="text-xs text-text-muted mt-1"> ${subCount} subcategorías
</p>`} <span class="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-action text-xs font-medium">→</span> </a>`;
  })} </div> </section> ${featuredProducts.length > 0 && renderTemplate`<section class="bg-bg-light border-t border-border"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"> <div class="flex items-center justify-between mb-8"> <div> <h2 class="text-2xl font-bold text-navy">Productos destacados</h2> <p class="text-sm text-text-muted mt-1">Las novedades de nuestro catálogo</p> </div> <a href="/catalogo" class="text-sm text-action hover:underline font-medium">
Ver todos →
</a> </div> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> ${featuredProducts.map((product) => {
    const categoriaId = typeof product.categoria === "object" ? product.categoria?.id : product.categoria;
    const descuento = user ? resolveDiscount(tarifas, product.id, categoriaId ?? null) : 0;
    const finalPrice = user ? calculatePrice(product.precio_base, descuento) : null;
    return renderTemplate`${renderComponent($$result2, "ProductCard", $$ProductCard, { "product": product, "price": finalPrice })}`;
  })} </div> </div> </section>`}${!user && renderTemplate`<section class="bg-navy text-white"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center"> <h2 class="text-2xl font-bold mb-3">
Acceda a precios exclusivos para profesionales
</h2> <p class="text-white/80 mb-6 max-w-lg mx-auto">
Regístrese como cliente profesional y obtenga descuentos especiales según su
          tipo de empresa. Proceso de validación rápido y seguro.
</p> <div class="flex gap-3 justify-center"> <a href="/registro" class="bg-action text-white px-6 py-3 rounded-lg font-medium hover:bg-action-hover transition-colors">
Solicitar acceso
</a> <a href="/login" class="border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
Ya tengo cuenta
</a> </div> </div> </section>`}` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/index.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
