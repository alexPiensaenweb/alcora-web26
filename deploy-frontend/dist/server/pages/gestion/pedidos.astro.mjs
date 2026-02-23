/* empty css                                          */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, o as Fragment } from '../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_g9L0Gq9n.mjs';
import { directusAdmin } from '../../chunks/directus_tOieuaro.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Pedidos = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Pedidos;
  const url = new URL(Astro2.request.url);
  const estadoFilter = url.searchParams.get("estado") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;
  let pedidos = [];
  let total = 0;
  try {
    const filters = estadoFilter ? `&filter[estado][_eq]=${estadoFilter}` : "";
    const res = await directusAdmin(
      `/items/pedidos?sort=-date_created&limit=${limit}&offset=${offset}&fields=id,estado,date_created,total,subtotal,costo_envio,metodo_pago,user_created.id,user_created.first_name,user_created.last_name,user_created.razon_social,user_created.email,user_created.telefono${filters}&meta=filter_count`
    );
    pedidos = res.data || [];
    total = res.meta?.filter_count || 0;
  } catch (err) {
    console.error("[admin/pedidos] Error:", err);
  }
  const totalPages = Math.ceil(total / limit);
  const ESTADOS = [
    { value: "", label: "Todos" },
    { value: "solicitado", label: "Solicitados" },
    { value: "presupuesto_solicitado", label: "Presupuestos" },
    { value: "aprobado_pendiente_pago", label: "Pendiente pago" },
    { value: "pagado", label: "Pagados" },
    { value: "enviado", label: "Enviados" },
    { value: "cancelado", label: "Cancelados" }
  ];
  const estadoLabel = {
    solicitado: "Solicitado",
    presupuesto_solicitado: "Presupuesto",
    aprobado_pendiente_pago: "Pte. pago",
    pagado: "Pagado",
    enviado: "Enviado",
    cancelado: "Cancelado"
  };
  const estadoColor = {
    solicitado: "bg-yellow-100 text-yellow-800",
    presupuesto_solicitado: "bg-amber-100 text-amber-800",
    aprobado_pendiente_pago: "bg-blue-100 text-blue-800",
    pagado: "bg-green-100 text-green-800",
    enviado: "bg-emerald-100 text-emerald-800",
    cancelado: "bg-red-100 text-red-800"
  };
  function formatDate(d) {
    return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  }
  function clienteNombre(p) {
    const u = p.user_created;
    if (!u) return "\u2014";
    return u.razon_social || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "\u2014";
  }
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Pedidos - Admin Alcora", "activeTab": "pedidos" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-5"> <!-- Header --> <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"> <div> <h1 class="text-2xl font-bold text-navy">Pedidos</h1> <p class="text-text-muted text-sm mt-0.5">${total} resultado${total !== 1 ? "s" : ""}</p> </div> </div> <!-- Filtros --> <div class="flex flex-wrap gap-2"> ${ESTADOS.map((e) => renderTemplate`<a${addAttribute(e.value ? `/gestion/pedidos?estado=${e.value}` : "/gestion/pedidos", "href")} data-astro-reload${addAttribute([
    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
    estadoFilter === e.value ? "bg-action text-white border-action" : "bg-white text-navy border-border hover:border-action hover:text-action"
  ], "class:list")}> ${e.label} </a>`)} </div> <!-- Table --> <div class="bg-white border border-border rounded-xl overflow-hidden"> ${pedidos.length > 0 ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <div class="overflow-x-auto"> <table class="w-full text-sm"> <thead> <tr class="bg-bg-light border-b border-border text-xs text-text-muted uppercase tracking-wide"> <th class="text-left px-4 py-3 font-semibold">Pedido</th> <th class="text-left px-4 py-3 font-semibold">Cliente</th> <th class="text-left px-4 py-3 font-semibold">Fecha</th> <th class="text-left px-4 py-3 font-semibold">Estado</th> <th class="text-left px-4 py-3 font-semibold">Pago</th> <th class="text-right px-4 py-3 font-semibold">Total</th> <th class="px-4 py-3"></th> </tr> </thead> <tbody class="divide-y divide-border"> ${pedidos.map((p) => renderTemplate`<tr class="hover:bg-bg-light transition-colors"> <td class="px-4 py-3 font-semibold text-navy">#${p.id}</td> <td class="px-4 py-3"> <div class="font-medium text-navy">${clienteNombre(p)}</div> ${p.user_created?.email && renderTemplate`<div class="text-xs text-text-muted">${p.user_created.email}</div>`} </td> <td class="px-4 py-3 text-text-muted whitespace-nowrap">${formatDate(p.date_created)}</td> <td class="px-4 py-3"> <span${addAttribute(`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[p.estado] || "bg-gray-100 text-gray-700"}`, "class")}> ${estadoLabel[p.estado] || p.estado} </span> </td> <td class="px-4 py-3 text-text-muted text-xs capitalize"> ${p.metodo_pago === "transferencia" ? "Transferencia" : p.metodo_pago === "tarjeta" ? "Tarjeta" : "\u2014"} </td> <td class="px-4 py-3 text-right font-semibold text-navy">${Number(p.total || 0).toFixed(2)} €</td> <td class="px-4 py-3 text-right"> <a${addAttribute(`/gestion/pedidos/${p.id}`, "href")} data-astro-reload class="text-action hover:underline text-xs font-medium">
Ver →
</a> </td> </tr>`)} </tbody> </table> </div> ${totalPages > 1 && renderTemplate`<div class="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-light"> <p class="text-xs text-text-muted">Página ${page} de ${totalPages}</p> <div class="flex gap-2"> ${page > 1 && renderTemplate`<a${addAttribute(`/gestion/pedidos?${estadoFilter ? `estado=${estadoFilter}&` : ""}page=${page - 1}`, "href")} data-astro-reload class="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-white transition-colors">
← Anterior
</a>`} ${page < totalPages && renderTemplate`<a${addAttribute(`/gestion/pedidos?${estadoFilter ? `estado=${estadoFilter}&` : ""}page=${page + 1}`, "href")} data-astro-reload class="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-white transition-colors">
Siguiente →
</a>`} </div> </div>`}` })}` : renderTemplate`<div class="py-16 text-center text-text-muted"> <span class="material-icons text-4xl opacity-30 mb-3 block">shopping_bag</span> <p>No hay pedidos con este filtro</p> </div>`} </div> </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/gestion/pedidos.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/gestion/pedidos.astro";
const $$url = "/gestion/pedidos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Pedidos,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
