/* empty css                                       */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BgOPDYG0.mjs';
export { renderers } from '../renderers.mjs';

const $$404 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "P\xE1gina no encontrada - Tienda Alcora" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-[60vh] flex items-center justify-center py-12 px-4"> <div class="text-center"> <p class="text-6xl font-bold text-border mb-4">404</p> <h1 class="text-2xl font-bold text-navy mb-2">Página no encontrada</h1> <p class="text-sm text-text-muted mb-8">
La página que busca no existe o ha sido movida.
</p> <div class="flex gap-3 justify-center"> <a href="/" class="bg-action text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-action-hover transition-colors">
Ir al inicio
</a> <a href="/catalogo" class="border border-border text-navy px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-bg-light transition-colors">
Ver catálogo
</a> </div> </div> </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/404.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
