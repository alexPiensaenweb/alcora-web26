/* empty css                                       */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { a as $cartList, b as $cartSubtotal, c as $shippingCost, d as $cartTotal, e as clearCart, r as removeFromCart, u as updateQuantity, $ as $$BaseLayout } from '../chunks/BaseLayout_BgOPDYG0.mjs';
import { $ as $$Breadcrumb } from '../chunks/Breadcrumb_Q93TwQUq.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { F as FREE_SHIPPING_THRESHOLD } from '../chunks/shipping_ByHlvqPN.mjs';
export { renderers } from '../renderers.mjs';

function formatCurrency(amount) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(amount);
}
function getDirectusUrl() {
  if (typeof document !== "undefined") {
    return document.body?.dataset?.directusUrl || window.__PUBLIC_DIRECTUS_URL || "";
  }
  return "";
}
function CartPage({ isLoggedIn = false }) {
  const items = useStore($cartList);
  const subtotal = useStore($cartSubtotal);
  const shipping = useStore($shippingCost);
  const total = useStore($cartTotal);
  const [presupuestoLoading, setPresupuestoLoading] = useState(false);
  const [presupuestoSent, setPresupuestoSent] = useState(false);
  const [presupuestoError, setPresupuestoError] = useState("");
  if (!isLoggedIn) {
    if (items.length > 0) {
      clearCart();
    }
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
      /* @__PURE__ */ jsx(
        "svg",
        {
          className: "w-20 h-20 mx-auto mb-4 text-[var(--color-border)]",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: /* @__PURE__ */ jsx(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 1,
              d: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            }
          )
        }
      ),
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-[var(--color-navy)] mb-2", children: "Acceda para ver su carrito" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-[var(--color-text-muted)] mb-6", children: "Los precios son exclusivos para clientes profesionales registrados." }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-center", children: [
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "/login",
            className: "inline-block bg-[var(--color-action)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors",
            children: "Iniciar sesion"
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "/registro",
            className: "inline-block border border-[var(--color-border)] text-[var(--color-navy)] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-bg-light)] transition-colors",
            children: "Crear cuenta"
          }
        )
      ] })
    ] });
  }
  if (items.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
      /* @__PURE__ */ jsx(
        "svg",
        {
          className: "w-20 h-20 mx-auto mb-4 text-[var(--color-border)]",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: /* @__PURE__ */ jsx(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 1,
              d: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
            }
          )
        }
      ),
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-[var(--color-navy)] mb-2", children: "Su carrito esta vacio" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-[var(--color-text-muted)] mb-6", children: "Explore nuestro catalogo y anada productos." }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/catalogo",
          className: "inline-block bg-[var(--color-action)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors",
          children: "Ver catalogo"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-[var(--color-navy)]", children: [
          "Carrito (",
          items.length,
          " ",
          items.length === 1 ? "producto" : "productos",
          ")"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => clearCart(),
            className: "text-sm text-red-600 hover:underline",
            children: "Vaciar carrito"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children: items.map((item) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "bg-white border border-[var(--color-border)] rounded-lg p-3 sm:p-4",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-14 h-14 sm:w-16 sm:h-16 bg-[var(--color-bg-light)] rounded flex-shrink-0 overflow-hidden", children: item.imagen ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: `${getDirectusUrl()}/assets/${item.imagen}`,
                  alt: item.nombre,
                  className: "w-full h-full object-contain"
                }
              ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-[var(--color-border)]", children: /* @__PURE__ */ jsx("svg", { className: "w-7 h-7", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" }) }) }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: `/catalogo/${item.slug}`,
                    className: "text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-action)] transition-colors line-clamp-2",
                    children: item.nombre
                  }
                ),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-[var(--color-text-muted)] mt-0.5", children: [
                  item.sku,
                  item.formato && ` | ${item.formato}`
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => removeFromCart(item.productoId),
                  className: "flex-shrink-0 p-1 text-[var(--color-text-muted)] hover:text-red-600 transition-colors",
                  children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--color-border)]/40", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-[var(--color-action)]", children: formatCurrency(item.precioUnitario) }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => updateQuantity(item.productoId, item.cantidad - 1),
                    className: "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-[var(--color-border)] rounded text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors text-sm",
                    children: "-"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "w-8 text-center text-sm font-medium", children: item.cantidad }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => updateQuantity(item.productoId, item.cantidad + 1),
                    className: "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-[var(--color-border)] rounded text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors text-sm",
                    children: "+"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-[var(--color-navy)]", children: formatCurrency(item.precioUnitario * item.cantidad) })
            ] })
          ]
        },
        item.productoId
      )) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "w-full lg:w-80 flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "bg-white border border-[var(--color-border)] rounded-lg p-6 sticky top-28", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-[var(--color-navy)] mb-4", children: "Resumen del pedido" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[var(--color-text-muted)]", children: "Subtotal" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatCurrency(subtotal) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[var(--color-text-muted)]", children: "Envio" }),
          /* @__PURE__ */ jsx("span", { className: `font-medium ${shipping === 0 ? "text-green-600" : ""}`, children: shipping === 0 ? "Gratis" : formatCurrency(shipping) })
        ] }),
        shipping > 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-[var(--color-text-muted)]", children: [
          "Envio gratuito a partir de ",
          formatCurrency(FREE_SHIPPING_THRESHOLD)
        ] }),
        /* @__PURE__ */ jsx("hr", { className: "border-[var(--color-border)]" }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-base font-bold", children: [
          /* @__PURE__ */ jsx("span", { children: "Total" }),
          /* @__PURE__ */ jsx("span", { className: "text-[var(--color-action)]", children: formatCurrency(total) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/checkout",
          className: "block mt-6 w-full bg-[var(--color-action)] text-white text-center py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors",
          children: "Tramitar Pedido"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: async () => {
            setPresupuestoError("");
            setPresupuestoLoading(true);
            try {
              const res = await fetch("/cart/presupuesto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: items.map((i) => ({
                    productoId: i.productoId,
                    nombre: i.nombre,
                    sku: i.sku,
                    cantidad: i.cantidad,
                    precioUnitario: i.precioUnitario,
                    formato: i.formato
                  }))
                })
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Error al solicitar presupuesto");
              setPresupuestoSent(true);
            } catch (err) {
              setPresupuestoError(err.message || "Error desconocido");
            } finally {
              setPresupuestoLoading(false);
            }
          },
          disabled: presupuestoLoading || presupuestoSent,
          className: "block mt-3 w-full border border-[var(--color-action)] text-[var(--color-action)] text-center py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-bg-accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          children: presupuestoLoading ? "Enviando..." : presupuestoSent ? "✓ Presupuesto solicitado" : "Solicitar Presupuesto Personalizado"
        }
      ),
      presupuestoSent && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2 text-center", children: "Hemos recibido su solicitud. Le enviaremos el presupuesto por email a la mayor brevedad." }),
      presupuestoError && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 text-center", children: presupuestoError }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/catalogo",
          className: "block mt-3 text-center text-sm text-[var(--color-action)] hover:underline",
          children: "Seguir comprando"
        }
      )
    ] }) })
  ] });
}

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Carrito = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Carrito;
  const isLoggedIn = !!Astro2.locals.user;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Carrito - Tienda Alcora" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> ${renderComponent($$result2, "Breadcrumb", $$Breadcrumb, { "items": [{ label: "Carrito" }] })} <h1 class="text-2xl font-bold text-navy mt-4 mb-6">Carrito de compra</h1> ${renderComponent($$result2, "CartPage", CartPage, { "client:load": true, "isLoggedIn": isLoggedIn, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/cart/CartPage", "client:component-export": "default" })} </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/carrito.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/carrito.astro";
const $$url = "/carrito";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Carrito,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
