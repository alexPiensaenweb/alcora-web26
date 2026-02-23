import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, n as renderSlot } from './astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from './BaseLayout_BgOPDYG0.mjs';

const $$Astro = createAstro("https://tienda.alcora.es");
const $$AdminLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AdminLayout;
  const { title = "Admin - Tienda Alcora", activeTab = "" } = Astro2.props;
  const user = Astro2.locals.user;
  const navItems = [
    { href: "/gestion", label: "Dashboard", icon: "grid_view", key: "dashboard" },
    { href: "/gestion/pedidos", label: "Pedidos", icon: "shopping_bag", key: "pedidos" },
    { href: "/gestion/usuarios", label: "Usuarios", icon: "group", key: "usuarios" },
    { href: "/gestion/productos", label: "Productos", icon: "inventory_2", key: "productos" }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen bg-bg-light"> <!-- Admin top bar --> <div class="bg-navy text-white px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between"> <div class="flex items-center gap-3"> <span class="material-icons text-xl">admin_panel_settings</span> <span class="font-semibold text-sm">Panel Administración</span> <span class="hidden sm:inline text-navy-200 text-xs opacity-60">|</span> <a href="/" class="hidden sm:inline text-xs opacity-60 hover:opacity-100 transition-opacity">← Volver a la tienda</a> </div> <div class="flex items-center gap-3 text-sm"> <span class="hidden sm:block opacity-70 text-xs">${user?.first_name || user?.email}</span> <a href="/" class="sm:hidden opacity-70 hover:opacity-100 text-xs">← Tienda</a> </div> </div> <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6"> <div class="flex flex-col lg:flex-row gap-6"> <!-- Sidebar --> <aside class="w-full lg:w-56 flex-shrink-0"> <nav class="bg-white border border-border rounded-lg overflow-hidden sticky top-4"> ${navItems.map((item) => renderTemplate`<a${addAttribute(item.href, "href")} data-astro-reload${addAttribute([
    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-border last:border-b-0",
    activeTab === item.key ? "bg-bg-accent text-action border-l-2 border-l-action" : "text-navy hover:bg-bg-light"
  ], "class:list")}> <span class="material-icons text-lg opacity-70">${item.icon}</span> ${item.label} </a>`)} <div class="border-t border-border mt-1"> <form action="/cuenta-api/logout" method="POST"> <button type="submit" class="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"> <span class="material-icons text-lg">logout</span>
Cerrar sesión
</button> </form> </div> </nav> </aside> <!-- Content --> <div class="flex-1 min-w-0"> ${renderSlot($$result2, $$slots["default"])} </div> </div> </div> </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/layouts/AdminLayout.astro", void 0);

export { $$AdminLayout as $ };
