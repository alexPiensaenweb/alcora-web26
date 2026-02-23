import { e as createAstro, f as createComponent, m as maybeRenderHead, h as addAttribute, r as renderTemplate, k as renderComponent, l as renderScript, ak as defineScriptVars, n as renderSlot, al as renderHead } from './astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useStore } from '@nanostores/react';
import { computed, atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { c as calculateShipping } from './shipping_ByHlvqPN.mjs';
import { useState, useEffect } from 'react';
import 'clsx';
/* empty css                         */
import { getEmpresa } from './directus_tOieuaro.mjs';

const $cartItems = persistentAtom(
  "alcora-cart",
  [],
  {
    encode: JSON.stringify,
    decode: JSON.parse
  }
);
function removeFromCart(productoId) {
  $cartItems.set($cartItems.get().filter((i) => i.productoId !== productoId));
}
function updateQuantity(productoId, cantidad) {
  if (cantidad <= 0) {
    removeFromCart(productoId);
    return;
  }
  const current = $cartItems.get();
  $cartItems.set(
    current.map(
      (i) => i.productoId === productoId ? { ...i, cantidad } : i
    )
  );
}
function clearCart() {
  $cartItems.set([]);
}
const $cartList = computed($cartItems, (items) => items);
const $cartCount = computed(
  $cartItems,
  (items) => items.reduce((sum, item) => sum + item.cantidad, 0)
);
const $cartSubtotal = computed(
  $cartItems,
  (items) => items.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0)
);
const $shippingCost = computed(
  $cartSubtotal,
  (subtotal) => calculateShipping(subtotal)
);
const $cartTotal = computed(
  [$cartSubtotal, $shippingCost],
  (subtotal, shipping) => subtotal + shipping
);

function CartIcon() {
  const count = useStore($cartCount);
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: "/carrito",
      className: "relative flex items-center gap-1 text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-action)] transition-colors",
      children: [
        /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", strokeWidth: 1.5, viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          }
        ) }),
        count > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1.5 -right-1.5 bg-[var(--color-action)] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center", children: count > 99 ? "99+" : count })
      ]
    }
  );
}

const $isLoggedIn = atom(false);
const $currentUser = atom(null);
function setUser(user) {
  $currentUser.set(user);
  $isLoggedIn.set(user !== null && (user.status === "active" || user.isAdmin === true));
}
function clearUser() {
  $currentUser.set(null);
  $isLoggedIn.set(false);
}
async function logout() {
  try {
    await fetch("/cuenta-api/logout", { method: "POST" });
  } catch {
  }
  try {
    localStorage.removeItem("alcora-cart");
  } catch {
  }
  clearUser();
  window.location.href = "/login";
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setUser(user);
  }, [user]);
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setOpen(!open),
        className: "flex items-center gap-2 text-sm font-medium text-navy hover:text-action transition-colors",
        children: [
          /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }),
          /* @__PURE__ */ jsx("span", { className: "hidden sm:inline max-w-[120px] truncate", children: user.first_name || user.email }),
          /* @__PURE__ */ jsx("svg", { className: `w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-40", onClick: () => setOpen(false) }),
      /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-56 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-50 py-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "px-4 py-2 border-b border-[var(--color-border)]", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-[var(--color-navy)]", children: [
            user.first_name,
            " ",
            user.last_name
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-[var(--color-text-muted)]", children: user.email }),
          user.grupo_cliente && /* @__PURE__ */ jsx("span", { className: "inline-block mt-1 px-2 py-0.5 bg-[var(--color-bg-accent)] text-[var(--color-action)] text-xs rounded-full capitalize", children: user.grupo_cliente })
        ] }),
        user.isAdmin ? /* @__PURE__ */ jsxs("a", { href: "/gestion", className: "flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-action)] hover:bg-[var(--color-bg-accent)] transition-colors", children: [
          /* @__PURE__ */ jsxs("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24", children: [
            /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }),
            /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
          ] }),
          "Panel de gestión"
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("a", { href: "/cuenta", className: "block px-4 py-2 text-sm text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors", children: "Mi Cuenta" }),
          /* @__PURE__ */ jsx("a", { href: "/cuenta/pedidos", className: "block px-4 py-2 text-sm text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors", children: "Mis Pedidos" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setOpen(false);
              logout();
            },
            className: "w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors",
            children: "Cerrar sesión"
          }
        )
      ] })
    ] })
  ] });
}

const $$Astro$3 = createAstro("https://tienda.alcora.es");
const $$CategoryIcon = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$CategoryIcon;
  const { slug, className = "w-8 h-8 text-action" } = Astro2.props;
  function iconGroup(value) {
    const s = value.toLowerCase();
    if (["control-de-plagas", "control-plagas", "insecticidas", "raticidas"].includes(s)) {
      return "plagas";
    }
    if ([
      "limpieza-profesional",
      "productos-de-limpieza",
      "limpieza-general",
      "cocina-y-area-alimentaria",
      "banos-y-sanitarios",
      "lavanderia",
      "superficies-especificas"
    ].includes(s)) {
      return "limpieza";
    }
    if (["desinfectantes", "desinfectantes-y-sanitizantes", "legionella"].includes(s)) {
      return "desinfeccion";
    }
    if (["epis", "guantes", "mascarilla", "bata-mono-traje", "babero", "calzas", "gorro"].includes(s)) {
      return "epis";
    }
    if (["agua", "filtros-en-punto-de-uso", "ionizacion-cobre-plata"].includes(s)) {
      return "agua";
    }
    if (["aire", "desinfeccion-de-espacios"].includes(s)) {
      return "aire";
    }
    if (["control-de-infecciones", "aislamiento"].includes(s)) {
      return "infecciones";
    }
    if (["gestion-de-residuos"].includes(s)) {
      return "residuos";
    }
    if (["cosmetica"].includes(s)) {
      return "cosmetica";
    }
    return "default";
  }
  const group = iconGroup(slug);
  return renderTemplate`${group === "plagas" && renderTemplate`${maybeRenderHead()}<svg${addAttribute(className, "class")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 9l-3-2M15 9l3-2M9 15l-3 2M15 15l3 2M8 12h8M12 6v12M9.5 7.5a3.5 3.5 0 015 0v9a3.5 3.5 0 01-5 0v-9z"></path></svg>`}${group === "limpieza" && renderTemplate`<svg${addAttribute(className, "class")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 3h6l1 4-4 2-4-2 1-4zM8 9h8l1 9a2 2 0 01-2 2H9a2 2 0 01-2-2l1-9zM5 13h2M17 13h2"></path></svg>`}${group === "desinfeccion" && renderTemplate`<svg${addAttribute(className, "class")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3l8 4v5c0 4.5-3 7.8-8 9-5-1.2-8-4.5-8-9V7l8-4zM9.5 12l1.8 1.8L14.8 10"></path></svg>`}${group === "epis" && renderTemplate`<svg${addAttribute(className, "class")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3a5 5 0 00-5 5v2h10V8a5 5 0 00-5-5zM5 12h14v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5z"></path></svg>`}${group === "agua" && renderTemplate`<svg${addAttribute(className, "class")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3s6 6.2 6 10a6 6 0 11-12 0c0-3.8 6-10 6-10z"></path></svg>`}${group === "aire" && renderTemplate`<svg${addAttribute(className, "class")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8h11a3 3 0 100-6M3 12h15a3 3 0 110 6M3 16h8a3 3 0 100 6"></path></svg>`}${group === "infecciones" && renderTemplate`<svg${addAttribute(className, "class")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4v16M4 12h16M7 7l10 10M17 7L7 17"></path></svg>`}${group === "residuos" && renderTemplate`<svg${addAttribute(className, "class")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10 3h4m-7 4h10m-8 0l1 12h4l1-12M9 11h6M9.8 15h4.4"></path></svg>`}${group === "cosmetica" && renderTemplate`<svg${addAttribute(className, "class")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3l1.8 3.6L18 8.4l-3 2.9.7 4.1-3.7-1.9-3.7 1.9.7-4.1-3-2.9 4.2-1.8L12 3z"></path></svg>`}${group === "default" && renderTemplate`<svg${addAttribute(className, "class")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 7l8-4 8 4-8 4-8-4zM4 12l8 4 8-4M4 17l8 4 8-4"></path></svg>`}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/catalog/CategoryIcon.astro", void 0);

const $$Astro$2 = createAstro("https://tienda.alcora.es");
const $$Header = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Header;
  const { user } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<header class="sticky top-0 z-50 bg-white shadow-sm">  <div class="bg-navy text-white">  <div class="md:hidden px-4 flex items-center justify-between h-12"> <a href="/" class="flex-shrink-0"> <img src="/logo-alcora-white.svg" alt="Alcora" class="h-7"> </a> <div class="flex items-center gap-2"> <a href="tel:+34976291019" class="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-white text-xs font-medium transition-colors"> <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"></path></svg>
Llamar
</a> <a href="https://wa.me/34976291019" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/35 px-3 py-1.5 rounded-full text-white text-xs font-medium transition-colors"> <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg>
WhatsApp
</a> </div> </div>  <div class="hidden md:block text-xs"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8"> <span>Alcora Salud Ambiental | Pol. Malpica C/ F Oeste Nave 98, Zaragoza</span> <div class="flex items-center gap-4"> <a href="tel:+34976291019" class="hover:text-action-hover transition-colors">976 29 10 19</a> <a href="mailto:central@alcora.es" class="hover:text-action-hover transition-colors">central@alcora.es</a> </div> </div> </div> </div>  <div class="hidden md:block border-b border-border"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16"> <a href="/" class="flex-shrink-0"> <img src="/logo-alcora.svg" alt="Alcora" class="h-10"> </a>  <form action="/catalogo" method="GET" class="flex flex-1 max-w-lg mx-8" id="header-search-form"> <div class="relative w-full"> <input type="search" name="search" autocomplete="off" id="header-search-input" placeholder="Buscar productos..." class="w-full pl-4 pr-10 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-action focus:ring-1 focus:ring-action"> <div id="header-search-dropdown" class="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg hidden z-50 overflow-hidden max-h-[400px] overflow-y-auto"></div> <button type="submit" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-action"> <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path> </svg> </button> </div> </form>  <div class="flex items-center gap-3"> ${user ? renderTemplate`${renderComponent($$result, "UserMenu", UserMenu, { "client:load": true, "user": user, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/auth/UserMenu", "client:component-export": "default" })}` : renderTemplate`<a href="/login" class="flex items-center gap-2 text-sm font-medium text-navy hover:text-action transition-colors"> <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path> </svg> <span>Acceder</span> </a>`} ${renderComponent($$result, "CartIcon", CartIcon, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/cart/CartIcon", "client:component-export": "default" })} </div> </div> </div>  <nav class="bg-bg-light border-b border-border hidden md:block"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-10"> <ul class="flex items-center gap-4 text-sm font-medium overflow-x-auto"> <li class="flex-shrink-0"><a href="/catalogo" class="text-navy hover:text-action transition-colors">Todos</a></li> <li class="flex-shrink-0"><a href="/categoria/productos-de-limpieza" class="text-text-muted hover:text-action transition-colors">Limpieza</a></li> <li class="flex-shrink-0"><a href="/categoria/agua" class="text-text-muted hover:text-action transition-colors">Agua</a></li> <li class="flex-shrink-0"><a href="/categoria/aire" class="text-text-muted hover:text-action transition-colors">Aire</a></li> <li class="flex-shrink-0"><a href="/categoria/control-de-plagas" class="text-text-muted hover:text-action transition-colors">Control de Plagas</a></li> <li class="flex-shrink-0"><a href="/categoria/control-de-infecciones" class="text-text-muted hover:text-action transition-colors">Control Infecciones</a></li> <li class="flex-shrink-0"><a href="/categoria/epis" class="text-text-muted hover:text-action transition-colors">EPIs</a></li> <li class="flex-shrink-0"><a href="/categoria/cosmetica" class="text-text-muted hover:text-action transition-colors">Cosmética</a></li> <li class="flex-shrink-0"><a href="/categoria/gestion-de-residuos" class="text-text-muted hover:text-action transition-colors">Gestión Residuos</a></li> </ul>  <a href="/marcas" class="flex-shrink-0 ml-6 text-sm font-semibold text-navy hover:text-action transition-colors">
Marcas
</a> </div> </nav> </header>    <div id="mobile-search-overlay" class="md:hidden fixed inset-0 z-[60] bg-white hidden"> <div class="flex items-center gap-3 px-4 h-14 border-b border-border"> <button id="mobile-search-close" class="p-1 text-navy" aria-label="Cerrar búsqueda"> <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"></path> </svg> </button> <form action="/catalogo" method="GET" class="flex-1" id="mobile-search-form"> <div class="relative w-full"> <input type="search" name="search" autocomplete="off" id="mobile-search-input" placeholder="Buscar productos..." class="w-full pl-4 pr-10 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-action focus:ring-1 focus:ring-action"> <button type="submit" class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-action"> <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path> </svg> </button> </div> </form> </div> <div id="mobile-search-dropdown" class="overflow-y-auto" style="max-height: calc(100vh - 57px);"></div> </div>    <div id="mobile-categories-overlay" class="md:hidden fixed inset-0 z-[60] hidden"> <div id="mobile-categories-backdrop" class="absolute inset-0 bg-black/40"></div> <div id="mobile-categories-panel" class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl transform transition-transform duration-300 translate-y-full max-h-[80vh] overflow-y-auto safe-area-bottom"> <div class="flex items-center justify-center py-3"> <div class="w-10 h-1 bg-border rounded-full"></div> </div> <div class="px-4 pb-6"> <p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Categorías</p> <div class="grid grid-cols-2 gap-2"> <a href="/catalogo" class="flex items-center gap-2.5 p-3 bg-bg-light rounded-xl text-sm font-medium text-navy hover:bg-bg-accent transition-colors"> <svg class="w-5 h-5 text-action flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7l8-4 8 4-8 4-8-4zM4 12l8 4 8-4M4 17l8 4 8-4"></path></svg>
Todos
</a> <a href="/categoria/productos-de-limpieza" class="flex items-center gap-2.5 p-3 bg-bg-light rounded-xl text-sm text-navy hover:bg-bg-accent transition-colors"> ${renderComponent($$result, "CategoryIcon", $$CategoryIcon, { "slug": "productos-de-limpieza", "className": "w-5 h-5 text-action flex-shrink-0" })}
Limpieza
</a> <a href="/categoria/agua" class="flex items-center gap-2.5 p-3 bg-bg-light rounded-xl text-sm text-navy hover:bg-bg-accent transition-colors"> ${renderComponent($$result, "CategoryIcon", $$CategoryIcon, { "slug": "agua", "className": "w-5 h-5 text-action flex-shrink-0" })}
Agua
</a> <a href="/categoria/aire" class="flex items-center gap-2.5 p-3 bg-bg-light rounded-xl text-sm text-navy hover:bg-bg-accent transition-colors"> ${renderComponent($$result, "CategoryIcon", $$CategoryIcon, { "slug": "aire", "className": "w-5 h-5 text-action flex-shrink-0" })}
Aire
</a> <a href="/categoria/control-de-plagas" class="flex items-center gap-2.5 p-3 bg-bg-light rounded-xl text-sm text-navy hover:bg-bg-accent transition-colors"> ${renderComponent($$result, "CategoryIcon", $$CategoryIcon, { "slug": "control-de-plagas", "className": "w-5 h-5 text-action flex-shrink-0" })}
Plagas
</a> <a href="/categoria/control-de-infecciones" class="flex items-center gap-2.5 p-3 bg-bg-light rounded-xl text-sm text-navy hover:bg-bg-accent transition-colors"> ${renderComponent($$result, "CategoryIcon", $$CategoryIcon, { "slug": "control-de-infecciones", "className": "w-5 h-5 text-action flex-shrink-0" })}
Infecciones
</a> <a href="/categoria/epis" class="flex items-center gap-2.5 p-3 bg-bg-light rounded-xl text-sm text-navy hover:bg-bg-accent transition-colors"> ${renderComponent($$result, "CategoryIcon", $$CategoryIcon, { "slug": "epis", "className": "w-5 h-5 text-action flex-shrink-0" })}
EPIs
</a> <a href="/categoria/cosmetica" class="flex items-center gap-2.5 p-3 bg-bg-light rounded-xl text-sm text-navy hover:bg-bg-accent transition-colors"> ${renderComponent($$result, "CategoryIcon", $$CategoryIcon, { "slug": "cosmetica", "className": "w-5 h-5 text-action flex-shrink-0" })}
Cosmética
</a> <a href="/categoria/gestion-de-residuos" class="flex items-center gap-2.5 p-3 bg-bg-light rounded-xl text-sm text-navy hover:bg-bg-accent transition-colors col-span-2"> ${renderComponent($$result, "CategoryIcon", $$CategoryIcon, { "slug": "gestion-de-residuos", "className": "w-5 h-5 text-action flex-shrink-0" })}
Gestión de Residuos
</a> </div> <div class="border-t border-border mt-4 pt-4"> <p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Marcas</p> <a href="/marcas" class="flex items-center gap-2.5 p-3 bg-bg-accent rounded-xl text-sm font-medium text-action hover:bg-action hover:text-white transition-colors"> <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z"></path></svg>
Ver todas las marcas
</a> </div> <div class="border-t border-border mt-4 pt-4"> <p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Contacto</p> <div class="flex gap-2"> <a href="tel:+34976291019" class="flex-1 flex items-center justify-center gap-2 p-3 bg-bg-light rounded-xl text-sm text-navy hover:bg-bg-accent transition-colors"> <svg class="w-4 h-4 text-action" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"></path></svg>
Llamar
</a> <a href="mailto:central@alcora.es" class="flex-1 flex items-center justify-center gap-2 p-3 bg-bg-light rounded-xl text-sm text-navy hover:bg-bg-accent transition-colors"> <svg class="w-4 h-4 text-action" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"></path></svg>
Email
</a> </div> </div> </div> </div> </div>    <nav id="mobile-bottom-bar" class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-bottom"> <div class="flex items-center justify-around h-14"> <button id="tab-categories" class="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-text-muted hover:text-action transition-colors" data-tab="categories"> <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"></path></svg> <span class="text-[10px] font-medium leading-none">Catalogo</span> </button> <button id="tab-search" class="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-text-muted hover:text-action transition-colors" data-tab="search"> <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"></path></svg> <span class="text-[10px] font-medium leading-none">Buscar</span> </button> <a${addAttribute(user ? "/cuenta" : "/login", "href")} class="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-text-muted hover:text-action transition-colors" data-tab="account"> <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg> <span class="text-[10px] font-medium leading-none">Cuenta</span> </a> <a href="/carrito" class="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-text-muted hover:text-action transition-colors relative" data-tab="cart"> <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"></path></svg> <span class="text-[10px] font-medium leading-none">Carrito</span> <span id="bottom-cart-badge" class="absolute -top-0.5 right-1/2 translate-x-3 bg-action text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center hidden">0</span> </a> </div> </nav> ${renderScript($$result, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/layout/Header.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/layout/Header.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  return renderTemplate`${maybeRenderHead()}<footer class="bg-navy text-white mt-auto"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"> <div class="grid grid-cols-1 md:grid-cols-4 gap-8">  <div> <img src="/logo-alcora.svg" alt="Alcora" class="h-10 brightness-0 invert mb-4"> <p class="text-sm text-gray-300 leading-relaxed">
Alcora Salud Ambiental. Soluciones profesionales en higiene, desinfección y control de plagas.
</p> </div>  <div> <p class="font-semibold mb-4 text-sm uppercase tracking-wider">Catálogo</p> <ul class="space-y-2 text-sm text-gray-300"> <li><a href="/categoria/productos-de-limpieza" class="hover:text-white transition-colors">Productos de Limpieza</a></li> <li><a href="/categoria/control-de-plagas" class="hover:text-white transition-colors">Control de Plagas</a></li> <li><a href="/categoria/epis" class="hover:text-white transition-colors">EPIs</a></li> <li><a href="/categoria/agua" class="hover:text-white transition-colors">Agua</a></li> <li><a href="/categoria/aire" class="hover:text-white transition-colors">Aire</a></li> <li><a href="/marcas" class="hover:text-white transition-colors">Marcas</a></li> </ul> </div>  <div> <p class="font-semibold mb-4 text-sm uppercase tracking-wider">Empresa</p> <ul class="space-y-2 text-sm text-gray-300"> <li><a href="/registro" class="hover:text-white transition-colors">Crear cuenta profesional</a></li> <li><a href="/login" class="hover:text-white transition-colors">Acceder</a></li> <li><a href="https://alcora.es" target="_blank" rel="noopener" class="hover:text-white transition-colors">Web corporativa</a></li> </ul> </div>  <div> <p class="font-semibold mb-4 text-sm uppercase tracking-wider">Contacto</p> <ul class="space-y-2 text-sm text-gray-300"> <li>Pol. Malpica C/ F Oeste Nave 98</li> <li>50016 Zaragoza, España</li> <li> <a href="tel:+34976291019" class="hover:text-white transition-colors">976 29 10 19</a> </li> <li> <a href="mailto:central@alcora.es" class="hover:text-white transition-colors">central@alcora.es</a> </li> </ul> </div> </div> <div class="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4"> <p class="text-sm text-gray-400">
&copy; ${currentYear} Alcora Salud Ambiental S.A. Todos los derechos reservados.
</p> <div class="flex gap-4 text-sm text-gray-400"> <a href="/aviso-legal" class="hover:text-white transition-colors">Aviso Legal</a> <a href="/politica-privacidad" class="hover:text-white transition-colors">Privacidad</a> <a href="/politica-cookies" class="hover:text-white transition-colors">Cookies</a> </div> </div> </div> </footer>`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/layout/Footer.astro", void 0);

const $$CookieConsent = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderScript($$result, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/layout/CookieConsent.astro?astro&type=script&index=0&lang.ts")} `;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/layout/CookieConsent.astro", void 0);

const $$Astro$1 = createAstro("https://tienda.alcora.es");
const $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ClientRouter;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/node_modules/astro/components/ClientRouter.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://tienda.alcora.es");
const $$BaseLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title = "Tienda Alcora", description = "Tienda Alcora Salud Ambiental - Productos de limpieza, control de plagas, desinfectantes y EPIs para profesionales", ogImage } = Astro2.props;
  const siteUrl = process.env.PUBLIC_SITE_URL || "https://tienda.alcora.es";
  const canonicalUrl = new URL(Astro2.url.pathname, siteUrl).href;
  const user = Astro2.locals.user;
  const empresa = await getEmpresa();
  const whatsappNumber = empresa?.telefono_whatsapp || null;
  const publicDirectusUrl = process.env.PUBLIC_DIRECTUS_URL || "https://tienda.alcora.es";
  const turnstileSiteKey = "0x4AAAAAACgxQy7BcQiVOwpp";
  return renderTemplate(_a || (_a = __template(['<html lang="es"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description"', '><link rel="canonical"', "><title>", '</title><meta property="og:type" content="website"><meta property="og:title"', '><meta property="og:description"', '><meta property="og:url"', '><meta property="og:site_name" content="Alcora Salud Ambiental"><meta property="og:locale" content="es_ES">', '<meta name="twitter:card"', '><meta name="twitter:title"', '><meta name="twitter:description"', ">", '<link rel="icon" type="image/png" href="/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"><link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">', "", '</head> <body class="min-h-screen flex flex-col bg-white text-navy font-sans"', "> ", ' <main class="flex-1 pb-16 md:pb-0"> ', " </main> ", " ", '  <div id="toast-container" class="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none items-center"></div>  ', "  <script>(function(){", '\n      if (typeof window !== "undefined") {\n        window.__ALCORA_USER__ = user;\n        window.__PUBLIC_DIRECTUS_URL = publicDirectusUrl;\n        window.__TURNSTILE_SITE_KEY = turnstileSiteKey;\n      }\n    })();</script> ', " </body> </html> "])), addAttribute(description, "content"), addAttribute(canonicalUrl, "href"), title, addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(canonicalUrl, "content"), ogImage && renderTemplate`<meta property="og:image"${addAttribute(ogImage, "content")}>`, addAttribute(ogImage ? "summary_large_image" : "summary", "content"), addAttribute(title, "content"), addAttribute(description, "content"), ogImage && renderTemplate`<meta name="twitter:image"${addAttribute(ogImage, "content")}>`, renderComponent($$result, "ViewTransitions", $$ClientRouter, {}), renderHead(), addAttribute(publicDirectusUrl, "data-directus-url"), renderComponent($$result, "Header", $$Header, { "user": user }), renderSlot($$result, $$slots["default"]), renderComponent($$result, "Footer", $$Footer, {}), renderComponent($$result, "CookieConsent", $$CookieConsent, {}), whatsappNumber && renderTemplate`<a${addAttribute(`https://wa.me/${whatsappNumber}`, "href")} target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp" class="hidden md:flex fixed bottom-6 right-4 z-[9998] w-14 h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-lg items-center justify-center transition-all duration-200 hover:scale-110"> <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"> <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path> </svg> </a>`, defineScriptVars({ user: user ? { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, grupo_cliente: user.grupo_cliente, status: user.status } : null, publicDirectusUrl, turnstileSiteKey }), renderScript($$result, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts"));
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $, $cartList as a, $cartSubtotal as b, $shippingCost as c, $cartTotal as d, clearCart as e, $$CategoryIcon as f, removeFromCart as r, setUser as s, updateQuantity as u };
