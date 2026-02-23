/* empty css                                       */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$AccountLayout } from '../chunks/AccountLayout_BiXJYpTF.mjs';
import { getPedidosForUser } from '../chunks/directus_tOieuaro.mjs';
import { f as formatCurrency } from '../chunks/pricing_CdYilCUq.mjs';
import { a as formatDate, e as estadoColor, b as estadoLabel } from '../chunks/utils_BzKe2XRh.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const user = Astro2.locals.user;
  const token = Astro2.locals.token;
  let pedidos = [];
  try {
    pedidos = await getPedidosForUser(token);
  } catch (error) {
    console.error("[cuenta] Error fetching pedidos:", error);
  }
  const recentPedidos = pedidos.slice(0, 5);
  const totalPedidos = pedidos.length;
  const pedidosPendientes = pedidos.filter(
    (p) => p.estado === "solicitado" || p.estado === "aprobado_pendiente_pago"
  ).length;
  return renderTemplate`${renderComponent($$result, "AccountLayout", $$AccountLayout, { "title": "Mi Cuenta - Tienda Alcora", "activeTab": "panel" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-6">  <div class="bg-bg-accent border border-border rounded-lg p-6"> <h2 class="text-lg font-bold text-navy">
Bienvenido, ${user.first_name || user.razon_social || user.email} </h2> <p class="text-sm text-text-muted mt-1">
Desde su panel puede gestionar sus pedidos y datos personales.
</p> </div>  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4"> <div class="bg-white border border-border rounded-lg p-4"> <p class="text-2xl font-bold text-navy">${totalPedidos}</p> <p class="text-sm text-text-muted">Total pedidos</p> </div> <div class="bg-white border border-border rounded-lg p-4"> <p class="text-2xl font-bold text-action">${pedidosPendientes}</p> <p class="text-sm text-text-muted">Pendientes</p> </div> <div class="bg-white border border-border rounded-lg p-4"> <p class="text-2xl font-bold text-navy capitalize"> ${user.grupo_cliente || "\u2014"} </p> <p class="text-sm text-text-muted">Grupo de cliente</p> </div> </div>  <div class="bg-white border border-border rounded-lg"> <div class="flex items-center justify-between p-4 border-b border-border"> <h3 class="font-semibold text-navy">Pedidos recientes</h3> <a href="/cuenta/pedidos" class="text-sm text-action hover:underline">
Ver todos
</a> </div> ${recentPedidos.length > 0 ? renderTemplate`<div class="divide-y divide-border"> ${recentPedidos.map((pedido) => renderTemplate`<a${addAttribute(`/cuenta/pedidos/${pedido.id}`, "href")} class="flex items-center justify-between p-4 hover:bg-bg-light transition-colors"> <div> <p class="text-sm font-medium text-navy">
Pedido #${pedido.id} </p> <p class="text-xs text-text-muted"> ${formatDate(pedido.date_created)} </p> </div> <div class="flex items-center gap-3"> <span${addAttribute(`px-2 py-1 text-xs rounded-full font-medium ${estadoColor(pedido.estado)}`, "class")}> ${estadoLabel(pedido.estado)} </span> <span class="text-sm font-semibold text-navy"> ${formatCurrency(pedido.total)} </span> </div> </a>`)} </div>` : renderTemplate`<div class="p-8 text-center"> <p class="text-sm text-text-muted">No tiene pedidos todavía.</p> <a href="/catalogo" class="inline-block mt-3 text-sm text-action hover:underline">
Explorar catálogo
</a> </div>`} </div> </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/cuenta/index.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/cuenta/index.astro";
const $$url = "/cuenta";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
