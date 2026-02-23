import { e as createAstro, f as createComponent, m as maybeRenderHead, h as addAttribute, k as renderComponent, r as renderTemplate, n as renderSlot } from './astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { f as $$CategoryIcon, $ as $$BaseLayout } from './BaseLayout_BgOPDYG0.mjs';
import { getCategorias } from './directus_tOieuaro.mjs';
import { f as formatCategoryName } from './utils_BzKe2XRh.mjs';
import { $ as $$Breadcrumb } from './Breadcrumb_Q93TwQUq.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useRef, useMemo, useEffect } from 'react';

const $$Astro$1 = createAstro("https://tienda.alcora.es");
const $$CategorySidebar = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$CategorySidebar;
  const { mode, currentCategorySlug } = Astro2.props;
  const allCategorias = await getCategorias();
  function getParentId(cat) {
    const raw = typeof cat.parent === "object" ? cat.parent?.id : cat.parent;
    if (raw === null || raw === void 0 || raw === "") return null;
    return Number(raw);
  }
  const currentPath = Astro2.url.pathname;
  const routeCategorySlug = currentPath.startsWith("/categoria/") ? currentPath.split("/")[2] || null : null;
  const categorySlug = currentCategorySlug || routeCategorySlug;
  const isCatalogRoot = mode === "root" ? true : mode === "children" ? false : currentPath.startsWith("/catalogo");
  function dedupeByName(cats) {
    return cats.filter((cat, index, all) => {
      const key = formatCategoryName(cat.nombre).toLowerCase();
      return all.findIndex(
        (candidate) => formatCategoryName(candidate.nombre).toLowerCase() === key
      ) === index;
    });
  }
  const topLevel = dedupeByName(
    allCategorias.filter((c) => getParentId(c) === null)
  );
  const currentCategory = categorySlug ? allCategorias.find((cat) => cat.slug === categorySlug) || null : null;
  const childCategories = currentCategory ? dedupeByName(
    allCategorias.filter((cat) => getParentId(cat) === Number(currentCategory.id))
  ) : [];
  const parentId = currentCategory ? getParentId(currentCategory) : null;
  const parentCategory = parentId ? allCategorias.find((c) => Number(c.id) === parentId) || null : null;
  const siblingCategories = parentId ? dedupeByName(
    allCategorias.filter((cat) => getParentId(cat) === parentId)
  ) : [];
  const hasChildren = childCategories.length > 0;
  const hasSiblings = siblingCategories.length > 0;
  let sidebarTitle;
  let itemsToShow;
  let backLink = null;
  if (isCatalogRoot) {
    sidebarTitle = "Categor\xEDas";
    itemsToShow = topLevel;
  } else if (hasChildren) {
    sidebarTitle = `Subcategor\xEDas de${formatCategoryName(currentCategory.nombre)}`;
    itemsToShow = childCategories;
    backLink = parentCategory ? { label: `\u2190 ${formatCategoryName(parentCategory.nombre)}`, href: `/categoria/${parentCategory.slug}` } : { label: "\u2190 Todas las categor\xEDas", href: "/catalogo" };
  } else if (hasSiblings && parentCategory) {
    sidebarTitle = formatCategoryName(parentCategory.nombre);
    itemsToShow = siblingCategories;
    backLink = { label: "\u2190 Todas las categor\xEDas", href: "/catalogo" };
  } else {
    sidebarTitle = "Categor\xEDas";
    itemsToShow = topLevel;
  }
  return renderTemplate`${maybeRenderHead()}<nav class="bg-white border border-border rounded-lg overflow-hidden"> <p class="px-4 py-3 text-sm font-bold text-navy bg-bg-light border-b border-border"> ${sidebarTitle} </p> ${itemsToShow.length > 0 ? renderTemplate`<ul class="py-1"> ${itemsToShow.map((cat) => {
    const isActive = currentPath.includes(`/categoria/${cat.slug}`);
    return renderTemplate`<li> <a${addAttribute(`/categoria/${cat.slug}`, "href")}${addAttribute([
      "flex items-center gap-2 px-4 py-2 text-sm transition-colors",
      isActive ? "text-action font-medium bg-bg-accent" : "text-navy hover:text-action hover:bg-bg-light"
    ], "class:list")}> ${renderComponent($$result, "CategoryIcon", $$CategoryIcon, { "slug": cat.slug, "className": "w-4 h-4 text-action" })} <span>${formatCategoryName(cat.nombre)}</span> </a> </li>`;
  })} </ul>` : renderTemplate`<div class="px-4 py-3 text-sm text-text-muted">
No hay categorías disponibles.
</div>`} ${backLink && renderTemplate`<div class="px-4 py-3 border-t border-border bg-white"> <a${addAttribute(backLink.href, "href")} class="text-sm text-action hover:underline"> ${backLink.label} </a> </div>`} ${!isCatalogRoot && !backLink && renderTemplate`<div class="px-4 py-3 border-t border-border bg-white"> <a href="/catalogo" class="text-sm text-action hover:underline">
Ver categorías principales
</a> </div>`} </nav>`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/catalog/CategorySidebar.astro", void 0);

const $$Astro = createAstro("https://tienda.alcora.es");
const $$CatalogLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$CatalogLayout;
  const {
    title,
    description,
    breadcrumbs = [],
    sidebarMode,
    currentCategorySlug
  } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> ${breadcrumbs.length > 0 && renderTemplate`${renderComponent($$result2, "Breadcrumb", $$Breadcrumb, { "items": breadcrumbs })}`} <div class="flex flex-col lg:flex-row gap-8 mt-4">  <aside class="w-full lg:w-64 flex-shrink-0"> ${renderComponent($$result2, "CategorySidebar", $$CategorySidebar, { "mode": sidebarMode, "currentCategorySlug": currentCategorySlug })} </aside>  <div class="flex-1 min-w-0"> ${renderSlot($$result2, $$slots["default"])} </div> </div> </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/layouts/CatalogLayout.astro", void 0);

function formatCurrency(amount) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(amount);
}
function InfiniteProductGrid({
  apiUrl,
  initialItems,
  initialPage,
  initialHasMore
}) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef(null);
  const ids = useMemo(() => new Set(items.map((i) => `${i.id}`)), [items]);
  useEffect(() => {
    if (!hasMore || loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loading) return;
        setLoading(true);
        setError("");
        try {
          const nextPage = page + 1;
          const joiner = apiUrl.includes("?") ? "&" : "?";
          const res = await fetch(`${apiUrl}${joiner}page=${nextPage}`, {
            credentials: "same-origin"
          });
          const payload = await res.json();
          if (!res.ok) throw new Error(payload.error || "Error cargando más productos");
          const incoming = (payload.items || []).filter(
            (item) => !ids.has(`${item.id}`)
          );
          setItems((prev) => [...prev, ...incoming]);
          setPage(nextPage);
          setHasMore(Boolean(payload.meta?.hasMore));
        } catch (err) {
          setError(err.message || "No se pudieron cargar más productos");
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "300px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [apiUrl, page, hasMore, loading, ids]);
  if (items.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-12 text-text-muted", children: [
      /* @__PURE__ */ jsx("svg", { className: "w-16 h-16 mx-auto mb-4 text-border", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm", children: "No se encontraron productos." })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: items.map((product) => /* @__PURE__ */ jsx(
      "article",
      {
        className: "bg-white border border-border rounded-lg overflow-hidden hover:shadow-card transition-shadow",
        children: /* @__PURE__ */ jsxs("a", { href: `/catalogo/${product.slug}`, className: "block", children: [
          /* @__PURE__ */ jsx("div", { className: "aspect-square bg-white border-b border-border overflow-hidden p-4 flex items-center justify-center", children: /* @__PURE__ */ jsx(
            "img",
            {
              src: product.imageUrl,
              alt: product.nombre,
              className: "w-full h-full object-contain",
              loading: "lazy"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted mb-1", children: product.sku }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-navy line-clamp-2 mb-2", children: product.nombre }),
            product.extracto && /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted line-clamp-2 mb-3", children: product.extracto }),
            product.formato && /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted mb-2", children: product.formato }),
            product.price !== null ? /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-action", children: formatCurrency(product.price) }) : /* @__PURE__ */ jsxs("p", { className: "text-xs text-text-muted italic", children: [
              /* @__PURE__ */ jsx("span", { className: "text-action", children: "Acceda" }),
              " para ver precios"
            ] })
          ] })
        ] })
      },
      `${product.id}`
    )) }),
    /* @__PURE__ */ jsxs("div", { ref: sentinelRef, className: "h-10 mt-4 flex items-center justify-center", children: [
      loading && /* @__PURE__ */ jsx("span", { className: "text-sm text-text-muted", children: "Cargando más productos..." }),
      !loading && !hasMore && /* @__PURE__ */ jsx("span", { className: "text-xs text-text-muted", children: "Ha llegado al final del listado" })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600 text-center mt-2", children: error })
  ] });
}

export { $$CatalogLayout as $, InfiniteProductGrid as I };
