/* empty css                                          */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, u as unescapeHTML, m as maybeRenderHead } from '../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$CatalogLayout, I as InfiniteProductGrid } from '../../chunks/InfiniteProductGrid_DaFANy-N.mjs';
import { getCategoriaBySlug, getCategorias, getProductos, getTarifasForGrupo, getAssetUrl } from '../../chunks/directus_tOieuaro.mjs';
import { r as resolveDiscount, c as calculatePrice } from '../../chunks/pricing_CdYilCUq.mjs';
import { f as formatCategoryName } from '../../chunks/utils_BzKe2XRh.mjs';
import { s as sanitizeHtml } from '../../chunks/sanitize_BunHQEFD.mjs';
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
  let categoria;
  try {
    categoria = await getCategoriaBySlug(slug);
  } catch (error) {
    console.error("[categoria/slug] Error fetching categoria:", error);
  }
  if (!categoria) {
    return Astro2.redirect("/catalogo");
  }
  Astro2.url;
  const limit = 24;
  let allCategorias = [];
  try {
    allCategorias = await getCategorias();
  } catch (error) {
    console.error("[categoria/slug] Error fetching all categorias:", error);
  }
  function collectDescendantIds(rootId, categorias) {
    const ids = [rootId];
    const queue = [rootId];
    while (queue.length > 0) {
      const current = queue.shift();
      const children = categorias.filter((cat) => {
        const parentId = typeof cat.parent === "object" ? cat.parent?.id : cat.parent;
        return parentId === current;
      });
      for (const child of children) {
        if (!ids.includes(child.id)) {
          ids.push(child.id);
          queue.push(child.id);
        }
      }
    }
    return ids;
  }
  const categoriaIds = collectDescendantIds(categoria.id, allCategorias);
  let products = [];
  let meta = { total_count: 0 };
  try {
    const result = await getProductos({
      categoriaIds,
      page: 1,
      limit
    });
    products = result.data;
    meta = result.meta;
  } catch (error) {
    console.error("[categoria/slug] Error fetching products:", error);
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
  const apiUrl = `/products-api?limit=${limit}&categoria=${encodeURIComponent(slug)}`;
  const parentCat = categoria.parent;
  const breadcrumbs = [];
  if (parentCat) {
    breadcrumbs.push({
      label: formatCategoryName(parentCat.nombre),
      href: `/categoria/${parentCat.slug}`
    });
  }
  breadcrumbs.push({ label: formatCategoryName(categoria.nombre) });
  allCategorias.filter((cat) => {
    const parentId = typeof cat.parent === "object" ? cat.parent?.id : cat.parent;
    return parentId === categoria.id;
  });
  const totalProducts = meta?.total_count || 0;
  const categoryName = formatCategoryName(categoria.nombre);
  const siteUrl = process.env.PUBLIC_SITE_URL || "https://tienda.alcora.es";
  const seoDescription = categoria.descripcion ? categoria.descripcion.replace(/<[^>]+>/g, "").slice(0, 155) : `Comprar ${categoryName} para profesionales. ${totalProducts} productos disponibles con stock inmediato. Distribuidor oficial - Alcora Salud Ambiental.`;
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} - Alcora Salud Ambiental`,
    description: seoDescription,
    url: `${siteUrl}/categoria/${slug}`,
    numberOfItems: totalProducts,
    ...parentCat ? {
      isPartOf: {
        "@type": "CollectionPage",
        name: formatCategoryName(parentCat.nombre),
        url: `${siteUrl}/categoria/${parentCat.slug}`
      }
    } : {},
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
      { "@type": "ListItem", position: 2, name: "Catálogo", item: `${siteUrl}/catalogo` },
      ...parentCat ? [{
        "@type": "ListItem",
        position: 3,
        name: formatCategoryName(parentCat.nombre),
        item: `${siteUrl}/categoria/${parentCat.slug}`
      }] : [],
      {
        "@type": "ListItem",
        position: parentCat ? 4 : 3,
        name: categoryName,
        item: `${siteUrl}/categoria/${slug}`
      }
    ]
  };
  return renderTemplate`${renderComponent($$result, "CatalogLayout", $$CatalogLayout, { "title": `${categoryName} - Productos profesionales | Tienda Alcora`, "description": seoDescription, "breadcrumbs": breadcrumbs, "sidebarMode": "children", "currentCategorySlug": slug }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div> <div class="flex items-center justify-between mb-6"> <h1 class="text-xl font-bold text-navy">', '</h1> <span class="text-sm text-text-muted"> ', " productos\n</span> </div> ", " ", "  ", ' </div> <script type="application/ld+json">', '</script> <script type="application/ld+json">', "</script> "])), maybeRenderHead(), categoryName, totalProducts, categoria.descripcion && renderTemplate`<div class="prose prose-sm max-w-none text-text-muted mb-6">${unescapeHTML(sanitizeHtml(categoria.descripcion))}</div>`, renderComponent($$result2, "InfiniteProductGrid", InfiniteProductGrid, { "client:load": true, "apiUrl": apiUrl, "initialItems": initialItems, "initialPage": 1, "initialHasMore": totalProducts > limit, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/catalog/InfiniteProductGrid", "client:component-export": "default" }), !categoria.descripcion && renderTemplate`<div class="mt-12 prose prose-sm max-w-none text-text-muted"> <h2 class="text-lg font-semibold text-navy"> ${categoryName} para profesionales
</h2> <p>
En Alcora Salud Ambiental ofrecemos un amplio catálogo de productos de
<strong> ${categoryName.toLowerCase()}</strong> para profesionales del sector.
          Stock inmediato, asesoramiento técnico y las mejores condiciones para empresas
          del sector de la sanidad ambiental, control de plagas y limpieza profesional.
</p> </div>`, unescapeHTML(JSON.stringify(collectionSchema)), unescapeHTML(JSON.stringify(breadcrumbSchema))) })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/categoria/[slug].astro", void 0);
const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/categoria/[slug].astro";
const $$url = "/categoria/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
