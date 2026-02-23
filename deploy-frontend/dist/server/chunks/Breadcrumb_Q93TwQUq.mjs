import { e as createAstro, f as createComponent, m as maybeRenderHead, k as renderComponent, o as Fragment, r as renderTemplate, h as addAttribute } from './astro/server_VyRwZjg8.mjs';
import 'piccolore';

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Breadcrumb = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Breadcrumb;
  const { items } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<nav aria-label="Breadcrumb" class="text-[11px] md:text-sm text-text-muted"> <ol class="flex items-center gap-0.5 md:gap-1 flex-wrap"> <li> <a href="/" class="hover:text-action transition-colors">Inicio</a> </li> ${items.map((item, i) => renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <li class="text-border">/</li> <li> ${item.href && i < items.length - 1 ? renderTemplate`<a${addAttribute(item.href, "href")} class="hover:text-action transition-colors">${item.label}</a>` : renderTemplate`<span class="text-navy font-medium">${item.label}</span>`} </li> ` })}`)} </ol> </nav>`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/ui/Breadcrumb.astro", void 0);

export { $$Breadcrumb as $ };
