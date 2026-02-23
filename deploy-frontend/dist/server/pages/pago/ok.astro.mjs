/* empty css                                          */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, o as Fragment } from '../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_BgOPDYG0.mjs';
import { directusAdmin, getAssetUrl } from '../../chunks/directus_tOieuaro.mjs';
import { f as formatCurrency } from '../../chunks/pricing_CdYilCUq.mjs';
import { a as formatDate, e as estadoColor, b as estadoLabel } from '../../chunks/utils_BzKe2XRh.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Ok = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Ok;
  const pedidoId = Astro2.url.searchParams.get("pedido");
  const user = Astro2.locals.user;
  if (pedidoId && !user) {
    return Astro2.redirect(`/login?redirect=${encodeURIComponent(Astro2.url.pathname + Astro2.url.search)}`);
  }
  let pedido = null;
  if (pedidoId && user) {
    try {
      const res = await directusAdmin(
        `/items/pedidos/${pedidoId}?fields=*,items.*,items.producto.nombre,items.producto.imagen_principal`
      );
      pedido = res.data;
      if (pedido && pedido.user_created !== user.id) {
        pedido = null;
      }
    } catch (err) {
      console.error("Error fetching pedido for pago/ok:", err instanceof Error ? err.message : "Unknown");
    }
  }
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Pago realizado - Tienda Alcora" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="bg-bg-light min-h-[70vh]"> <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">  <div class="text-center mb-8"> <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"> <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(2, "stroke-width")} d="M5 13l4 4L19 7"></path> </svg> </div> <h1 class="text-2xl lg:text-3xl font-bold text-navy mb-2">
Pago realizado correctamente
</h1> <p class="text-text-muted"> ${pedido ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`Pedido <strong>#${pedido.id}</strong> confirmado. Recibirá un email con los detalles.` })}` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`Su pago ha sido procesado correctamente.` })}`} </p> </div> ${pedido && renderTemplate`<div class="space-y-6">  <div class="bg-white border border-border rounded-xl overflow-hidden shadow-sm"> <div class="p-5 border-b border-border flex items-center justify-between"> <div> <h2 class="font-semibold text-navy text-lg">Pedido #${pedido.id}</h2> <p class="text-sm text-text-muted">${formatDate(pedido.date_created)}</p> </div> <span${addAttribute(`px-3 py-1.5 text-sm rounded-full font-medium ${estadoColor(pedido.estado)}`, "class")}> ${estadoLabel(pedido.estado)} </span> </div>  <div class="divide-y divide-border"> ${pedido.items.map((item) => {
    const producto = typeof item.producto === "object" ? item.producto : null;
    return renderTemplate`<div class="flex items-center gap-4 p-4"> <div class="w-14 h-14 bg-bg-light rounded-lg flex-shrink-0 overflow-hidden"> ${producto?.imagen_principal ? renderTemplate`<img${addAttribute(getAssetUrl(producto.imagen_principal), "src")}${addAttribute(item.nombre_producto, "alt")} class="w-full h-full object-contain">` : renderTemplate`<div class="w-full h-full flex items-center justify-center text-border"> <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(1, "stroke-width")} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path> </svg> </div>`} </div> <div class="flex-1 min-w-0"> <p class="text-sm font-medium text-navy truncate">${item.nombre_producto}</p> <p class="text-xs text-text-muted">${item.cantidad} x ${formatCurrency(item.precio_unitario)}</p> </div> <div class="text-sm font-semibold text-navy"> ${formatCurrency(item.subtotal)} </div> </div>`;
  })} </div>  <div class="p-5 bg-bg-light border-t border-border"> <div class="space-y-2 text-sm"> <div class="flex justify-between"> <span class="text-text-muted">Subtotal</span> <span class="font-medium">${formatCurrency(pedido.subtotal)}</span> </div> <div class="flex justify-between"> <span class="text-text-muted">Envio</span> <span${addAttribute(`font-medium ${pedido.costo_envio === 0 ? "text-green-600" : ""}`, "class")}> ${pedido.costo_envio === 0 ? "Gratis" : formatCurrency(pedido.costo_envio)} </span> </div> <hr class="border-border"> <div class="flex justify-between text-base font-bold"> <span>Total</span> <span class="text-action">${formatCurrency(pedido.total)}</span> </div> </div> </div> </div>  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"> <div class="bg-white border border-border rounded-xl p-5"> <h3 class="text-sm font-semibold text-navy mb-2">Direccion de envio</h3> <p class="text-sm text-text-muted whitespace-pre-line">${pedido.direccion_envio || "No especificada"}</p> </div> <div class="bg-white border border-border rounded-xl p-5"> <h3 class="text-sm font-semibold text-navy mb-2">Metodo de pago</h3> <p class="text-sm text-text-muted capitalize">${pedido.metodo_pago || "Transferencia"}</p> ${pedido.referencia_pago && renderTemplate`<p class="text-xs text-text-muted mt-1 font-mono">${pedido.referencia_pago}</p>`} </div> </div> </div>`}  <div class="flex flex-col sm:flex-row gap-3 justify-center mt-8"> <a href="/cuenta/pedidos" class="inline-flex items-center justify-center gap-2 bg-action text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-action-hover transition-colors">
Ver mis pedidos
</a> <a href="/catalogo" class="inline-flex items-center justify-center gap-2 border border-border text-navy px-6 py-3 rounded-lg text-sm font-medium hover:bg-bg-light transition-colors">
Seguir comprando
</a> </div> </div> </section> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/pago/ok.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/pago/ok.astro";
const $$url = "/pago/ok";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Ok,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
