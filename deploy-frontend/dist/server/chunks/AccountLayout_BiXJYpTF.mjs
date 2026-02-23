import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, n as renderSlot } from './astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from './BaseLayout_BgOPDYG0.mjs';

const $$Astro = createAstro("https://tienda.alcora.es");
const $$AccountLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AccountLayout;
  const { title = "Mi Cuenta - Tienda Alcora", activeTab = "" } = Astro2.props;
  const user = Astro2.locals.user;
  const navItems = [
    { href: "/cuenta", label: "Panel", icon: "dashboard", key: "panel" },
    { href: "/cuenta/pedidos", label: "Mis Pedidos", icon: "orders", key: "pedidos" },
    { href: "/cuenta/perfil", label: "Perfil", icon: "profile", key: "perfil" }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> <h1 class="text-2xl font-bold text-navy mb-6">Mi Cuenta</h1> <div class="flex flex-col lg:flex-row gap-8">  <aside class="w-full lg:w-64 flex-shrink-0"> <nav class="bg-white border border-border rounded-lg overflow-hidden"> ${navItems.map((item) => renderTemplate`<a${addAttribute(item.href, "href")}${addAttribute([
    "block px-4 py-3 text-sm font-medium transition-colors border-b border-border last:border-b-0",
    activeTab === item.key ? "bg-bg-accent text-action" : "text-navy hover:bg-bg-light"
  ], "class:list")}> ${item.label} </a>`)} <form action="/cuenta-api/logout" method="POST"> <button type="submit" class="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
Cerrar sesión
</button> </form> </nav> ${user && renderTemplate`<div class="mt-4 p-4 bg-bg-light rounded-lg text-sm"> <p class="font-medium text-navy">${user.razon_social || `${user.first_name} ${user.last_name}`}</p> <p class="text-text-muted">${user.email}</p> ${user.grupo_cliente && renderTemplate`<span class="inline-block mt-2 px-2 py-1 bg-bg-accent text-action text-xs rounded-full font-medium capitalize"> ${user.grupo_cliente} </span>`} </div>`} </aside>  <div class="flex-1 min-w-0"> ${renderSlot($$result2, $$slots["default"])} </div> </div> </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/layouts/AccountLayout.astro", void 0);

export { $$AccountLayout as $ };
