/* empty css                                             */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$AccountLayout } from '../../../chunks/AccountLayout_BiXJYpTF.mjs';
import { getPedidoById, getAssetUrl } from '../../../chunks/directus_tOieuaro.mjs';
import { f as formatCurrency } from '../../../chunks/pricing_CdYilCUq.mjs';
import { a as formatDate, e as estadoColor, b as estadoLabel } from '../../../chunks/utils_BzKe2XRh.mjs';
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro("https://tienda.alcora.es");
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  const token = Astro2.locals.token;
  const pagoStatus = Astro2.url.searchParams.get("pago");
  let pedido;
  try {
    pedido = await getPedidoById(parseInt(id), token);
  } catch {
    try {
      const { directusAdmin } = await import('../../../chunks/directus_tOieuaro.mjs');
      const res = await directusAdmin(
        `/items/pedidos/${id}?fields=*,items.*,items.producto.nombre,items.producto.imagen_principal`
      );
      pedido = res.data;
    } catch (error) {
      console.error("[cuenta/pedidos/id] Error fetching pedido:", error);
    }
  }
  if (!pedido) {
    return Astro2.redirect("/cuenta/pedidos");
  }
  return renderTemplate`${renderComponent($$result, "AccountLayout", $$AccountLayout, { "title": `Pedido #${pedido.id} - Tienda Alcora`, "activeTab": "pedidos" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-6">  ${pagoStatus === "ok" && renderTemplate`<div class="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"> <svg class="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(2, "stroke-width")} d="M5 13l4 4L19 7"></path> </svg> <div> <p class="font-semibold text-green-800">Pago realizado correctamente</p> <p class="text-sm text-green-700">Su pago ha sido procesado. Recibirá una confirmación por email.</p> </div> </div>`} ${pagoStatus === "ko" && renderTemplate`<div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"> <svg class="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(2, "stroke-width")} d="M6 18L18 6M6 6l12 12"></path> </svg> <div> <p class="font-semibold text-red-800">Pago no completado</p> <p class="text-sm text-red-700">El pago no se ha podido procesar. Puede intentarlo de nuevo o elegir otro método de pago.</p> </div> </div>`}  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"> <div> <a href="/cuenta/pedidos" class="text-sm text-action hover:underline mb-2 inline-block">
&larr; Volver a pedidos
</a> <h2 class="text-xl font-bold text-navy">Pedido #${pedido.id}</h2> <p class="text-sm text-text-muted">${formatDate(pedido.date_created)}</p> </div> <span${addAttribute(`px-3 py-1.5 text-sm rounded-full font-medium ${estadoColor(pedido.estado)}`, "class")}> ${estadoLabel(pedido.estado)} </span> </div>  <div class="bg-white border border-border rounded-lg overflow-hidden"> <div class="p-4 border-b border-border"> <h3 class="font-semibold text-navy">Productos</h3> </div> <div class="divide-y divide-border"> ${pedido.items.map((item) => {
    const producto = typeof item.producto === "object" ? item.producto : null;
    return renderTemplate`<div class="flex items-center gap-4 p-4"> <div class="w-12 h-12 bg-bg-light rounded flex-shrink-0 overflow-hidden"> ${producto?.imagen_principal ? renderTemplate`<img${addAttribute(getAssetUrl(producto.imagen_principal), "src")}${addAttribute(item.nombre_producto, "alt")} class="w-full h-full object-contain">` : renderTemplate`<div class="w-full h-full flex items-center justify-center text-border"> <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(1, "stroke-width")} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path> </svg> </div>`} </div> <div class="flex-1 min-w-0"> <p class="text-sm font-medium text-navy">${item.nombre_producto}</p> <p class="text-xs text-text-muted">SKU: ${item.sku}</p> </div> <div class="text-sm text-text-muted text-right"> ${item.cantidad} x ${formatCurrency(item.precio_unitario)} </div> <div class="text-sm font-semibold text-navy w-24 text-right"> ${formatCurrency(item.subtotal)} </div> </div>`;
  })} </div> </div>  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">  <div class="bg-white border border-border rounded-lg p-6"> <h3 class="font-semibold text-navy mb-4">Resumen</h3> <div class="space-y-2 text-sm"> <div class="flex justify-between"> <span class="text-text-muted">Subtotal</span> <span class="font-medium">${formatCurrency(pedido.subtotal)}</span> </div> <div class="flex justify-between"> <span class="text-text-muted">Envio</span> <span${addAttribute(`font-medium ${pedido.costo_envio === 0 ? "text-green-600" : ""}`, "class")}> ${pedido.costo_envio === 0 ? "Gratis" : formatCurrency(pedido.costo_envio)} </span> </div> <hr class="border-border"> <div class="flex justify-between text-base font-bold"> <span>Total</span> <span class="text-action">${formatCurrency(pedido.total)}</span> </div> </div> <div class="mt-4 pt-4 border-t border-border space-y-2 text-sm"> <div class="flex justify-between"> <span class="text-text-muted">Metodo de pago</span> <span class="font-medium capitalize">${pedido.metodo_pago || "\u2014"}</span> </div> ${pedido.referencia_pago && renderTemplate`<div class="flex justify-between"> <span class="text-text-muted">Ref. pago</span> <span class="font-mono text-xs">${pedido.referencia_pago}</span> </div>`} </div> </div>  <div class="bg-white border border-border rounded-lg p-6"> <h3 class="font-semibold text-navy mb-4">Direcciones</h3> <div class="space-y-4 text-sm"> <div> <p class="font-medium text-navy mb-1">Envio</p> <p class="text-text-muted whitespace-pre-line"> ${pedido.direccion_envio || "No especificada"} </p> </div> <div> <p class="font-medium text-navy mb-1">Facturacion</p> <p class="text-text-muted whitespace-pre-line"> ${pedido.direccion_facturacion || "No especificada"} </p> </div> </div> ${pedido.notas_cliente && renderTemplate`<div class="mt-4 pt-4 border-t border-border"> <p class="font-medium text-navy text-sm mb-1">Notas del cliente</p> <p class="text-sm text-text-muted">${pedido.notas_cliente}</p> </div>`} ${pedido.notas_admin && renderTemplate`<div class="mt-4 pt-4 border-t border-border"> <p class="font-medium text-navy text-sm mb-1">Notas del administrador</p> <p class="text-sm text-text-muted">${pedido.notas_admin}</p> </div>`} </div> </div> </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/cuenta/pedidos/[id].astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/cuenta/pedidos/[id].astro";
const $$url = "/cuenta/pedidos/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
