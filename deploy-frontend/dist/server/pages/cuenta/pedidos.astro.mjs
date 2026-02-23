/* empty css                                          */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$AccountLayout } from '../../chunks/AccountLayout_BiXJYpTF.mjs';
import { getPedidosForUser } from '../../chunks/directus_tOieuaro.mjs';
import { f as formatCurrency } from '../../chunks/pricing_CdYilCUq.mjs';
import { a as formatDate, e as estadoColor, b as estadoLabel } from '../../chunks/utils_BzKe2XRh.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Pedidos = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Pedidos;
  const token = Astro2.locals.token;
  let pedidos = [];
  try {
    pedidos = await getPedidosForUser(token);
  } catch (error) {
    console.error("[cuenta/pedidos] Error fetching pedidos:", error);
  }
  return renderTemplate`${renderComponent($$result, "AccountLayout", $$AccountLayout, { "title": "Mis Pedidos - Tienda Alcora", "activeTab": "pedidos" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div> <h2 class="text-xl font-bold text-navy mb-6">Mis Pedidos</h2> ${pedidos.length > 0 ? renderTemplate`<div class="bg-white border border-border rounded-lg overflow-hidden">  <div class="hidden md:block"> <table class="w-full text-sm"> <thead class="bg-bg-light text-left"> <tr> <th class="px-4 py-3 font-medium text-text-muted">Pedido</th> <th class="px-4 py-3 font-medium text-text-muted">Fecha</th> <th class="px-4 py-3 font-medium text-text-muted">Estado</th> <th class="px-4 py-3 font-medium text-text-muted">Productos</th> <th class="px-4 py-3 font-medium text-text-muted text-right">Total</th> <th class="px-4 py-3"></th> </tr> </thead> <tbody class="divide-y divide-border"> ${pedidos.map((pedido) => renderTemplate`<tr class="hover:bg-bg-light transition-colors"> <td class="px-4 py-3 font-medium text-navy">#${pedido.id}</td> <td class="px-4 py-3 text-text-muted"> ${formatDate(pedido.date_created)} </td> <td class="px-4 py-3"> <span${addAttribute(`px-2 py-1 text-xs rounded-full font-medium ${estadoColor(pedido.estado)}`, "class")}> ${estadoLabel(pedido.estado)} </span> </td> <td class="px-4 py-3 text-text-muted"> ${pedido.items?.length || 0} art.
</td> <td class="px-4 py-3 text-right font-semibold text-navy"> ${formatCurrency(pedido.total)} </td> <td class="px-4 py-3 text-right"> <a${addAttribute(`/cuenta/pedidos/${pedido.id}`, "href")} class="text-action hover:underline text-sm">
Ver detalle
</a> </td> </tr>`)} </tbody> </table> </div>  <div class="md:hidden divide-y divide-border"> ${pedidos.map((pedido) => renderTemplate`<a${addAttribute(`/cuenta/pedidos/${pedido.id}`, "href")} class="block p-4 hover:bg-bg-light transition-colors"> <div class="flex items-center justify-between mb-2"> <span class="font-medium text-navy">Pedido #${pedido.id}</span> <span${addAttribute(`px-2 py-1 text-xs rounded-full font-medium ${estadoColor(pedido.estado)}`, "class")}> ${estadoLabel(pedido.estado)} </span> </div> <div class="flex items-center justify-between text-sm"> <span class="text-text-muted">${formatDate(pedido.date_created)}</span> <span class="font-semibold text-navy">${formatCurrency(pedido.total)}</span> </div> </a>`)} </div> </div>` : renderTemplate`<div class="bg-white border border-border rounded-lg p-12 text-center"> <svg class="w-16 h-16 mx-auto mb-4 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(1, "stroke-width")} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path> </svg> <h3 class="text-lg font-semibold text-navy mb-2">No tiene pedidos</h3> <p class="text-sm text-text-muted mb-6">
Explore nuestro catálogo y realice su primer pedido.
</p> <a href="/catalogo" class="inline-block bg-action text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-action-hover transition-colors">
Ver catálogo
</a> </div>`} </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/cuenta/pedidos.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/cuenta/pedidos.astro";
const $$url = "/cuenta/pedidos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Pedidos,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
