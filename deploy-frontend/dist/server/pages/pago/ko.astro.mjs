/* empty css                                          */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, o as Fragment } from '../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_BgOPDYG0.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Ko = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Ko;
  const pedidoId = Astro2.url.searchParams.get("pedido");
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Pago no completado - Tienda Alcora" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="bg-bg-light min-h-[70vh]"> <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">  <div class="text-center mb-8"> <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5"> <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(2, "stroke-width")} d="M6 18L18 6M6 6l12 12"></path> </svg> </div> <h1 class="text-2xl lg:text-3xl font-bold text-navy mb-2">
Pago no completado
</h1> <p class="text-text-muted max-w-md mx-auto"> ${pedidoId ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate`El pago del pedido <strong>#${pedidoId}</strong> no se ha podido procesar. No se ha realizado ningun cargo en su cuenta.` })}` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate`El pago no se ha podido procesar. No se ha realizado ningun cargo en su cuenta.` })}`} </p> </div>  <div class="bg-white border border-border rounded-xl p-6 shadow-sm mb-8"> <h2 class="font-semibold text-navy mb-4">Posibles motivos</h2> <ul class="space-y-3 text-sm text-text-muted"> <li class="flex items-start gap-3"> <svg class="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(2, "stroke-width")} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> <span>La operacion fue cancelada o el tiempo expiro.</span> </li> <li class="flex items-start gap-3"> <svg class="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(2, "stroke-width")} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> <span>Fondos insuficientes o limite de la tarjeta superado.</span> </li> <li class="flex items-start gap-3"> <svg class="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(2, "stroke-width")} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> <span>La autenticacion 3D Secure no fue completada.</span> </li> <li class="flex items-start gap-3"> <svg class="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round"${addAttribute(2, "stroke-width")} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> <span>Error temporal en la comunicacion con la entidad bancaria.</span> </li> </ul> </div>  <div class="bg-[var(--color-bg-accent)] border border-action/20 rounded-xl p-5 mb-8"> <p class="text-sm text-navy">
Su pedido sigue registrado. Puede intentar el pago de nuevo desde
<a href="/cuenta/pedidos" class="text-action font-medium hover:underline"> sus pedidos</a>,
          o ponerse en contacto con nosotros si necesita ayuda.
</p> </div>  <div class="flex flex-col sm:flex-row gap-3 justify-center"> ${pedidoId && renderTemplate`<a${addAttribute(`/cuenta/pedidos/${pedidoId}`, "href")} class="inline-flex items-center justify-center gap-2 bg-action text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-action-hover transition-colors">
Ver pedido #${pedidoId} </a>`} <a href="/cuenta/pedidos" class="inline-flex items-center justify-center gap-2 border border-border text-navy px-6 py-3 rounded-lg text-sm font-medium hover:bg-bg-light transition-colors">
Ver todos mis pedidos
</a> <a href="mailto:central@alcora.es" class="inline-flex items-center justify-center gap-2 border border-border text-navy px-6 py-3 rounded-lg text-sm font-medium hover:bg-bg-light transition-colors">
Contactar soporte
</a> </div> </div> </section> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/pago/ko.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/pago/ko.astro";
const $$url = "/pago/ko";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Ko,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
