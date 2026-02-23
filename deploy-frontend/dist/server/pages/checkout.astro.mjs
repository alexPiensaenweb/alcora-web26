/* empty css                                       */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { a as $cartList, b as $cartSubtotal, c as $shippingCost, d as $cartTotal, e as clearCart, $ as $$BaseLayout } from '../chunks/BaseLayout_BgOPDYG0.mjs';
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
function CheckoutForm({ user }) {
  const items = useStore($cartList);
  const subtotal = useStore($cartSubtotal);
  const shipping = useStore($shippingCost);
  const total = useStore($cartTotal);
  const [direccionEnvio, setDireccionEnvio] = useState(
    user.direccion_envio || user.direccion_facturacion || ""
  );
  const [direccionFacturacion, setDireccionFacturacion] = useState(
    user.direccion_facturacion || ""
  );
  const [mismaDir, setMismaDir] = useState(
    !user.direccion_facturacion || user.direccion_facturacion === user.direccion_envio || !user.direccion_envio
  );
  const [notasCliente, setNotasCliente] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);
  if (items.length === 0 && !orderId) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-[var(--color-navy)] mb-2", children: "Su carrito esta vacio" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-[var(--color-text-muted)] mb-6", children: "Anada productos antes de continuar con el pedido." }),
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
  if (orderId) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-xl mx-auto py-12", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-[var(--color-navy)] text-center mb-2", children: "Pedido registrado" }),
      /* @__PURE__ */ jsxs("p", { className: "text-center text-[var(--color-text-muted)] mb-6", children: [
        "Pedido ",
        /* @__PURE__ */ jsxs("strong", { children: [
          "#",
          orderId
        ] }),
        " recibido correctamente."
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-[var(--color-bg-accent)] border border-[var(--color-border)] rounded-lg p-6 mb-6", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-[var(--color-navy)] leading-relaxed", children: "Nos pondremos en contacto con usted para confirmar el pedido y coordinar el metodo de pago y los detalles de envio. Recibira una notificacion por email." }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-center", children: [
        /* @__PURE__ */ jsx("a", { href: "/cuenta/pedidos", className: "bg-[var(--color-action)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors", children: "Ver mis pedidos" }),
        /* @__PURE__ */ jsx("a", { href: "/catalogo", className: "border border-[var(--color-border)] text-[var(--color-navy)] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-bg-light)] transition-colors", children: "Seguir comprando" })
      ] })
    ] });
  }
  async function handleSubmit() {
    if (!direccionEnvio.trim()) {
      setError("Debe indicar una direccion de envio");
      return;
    }
    if (!mismaDir && !direccionFacturacion.trim()) {
      setError("Debe indicar una direccion de facturacion");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/cart/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad
          })),
          direccion_envio: direccionEnvio,
          direccion_facturacion: mismaDir ? direccionEnvio : direccionFacturacion,
          metodo_pago: "pendiente",
          notas_cliente: notasCliente || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar el pedido");
      clearCart();
      setOrderId(data.pedido.id);
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-[var(--color-bg-accent)] border border-[var(--color-border)] rounded-lg p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-[var(--color-navy)]", children: "Datos de facturacion" }),
          /* @__PURE__ */ jsx("a", { href: "/cuenta", className: "text-xs text-[var(--color-action)] hover:underline", children: "Editar perfil" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-[var(--color-text-muted)]", children: "Nombre: " }),
            /* @__PURE__ */ jsx("span", { className: "text-[var(--color-navy)] font-medium", children: [user.first_name, user.last_name].filter(Boolean).join(" ") || "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-[var(--color-text-muted)]", children: "Empresa: " }),
            /* @__PURE__ */ jsx("span", { className: "text-[var(--color-navy)] font-medium", children: user.razon_social || "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-[var(--color-text-muted)]", children: "CIF/NIF: " }),
            /* @__PURE__ */ jsx("span", { className: "text-[var(--color-navy)] font-medium", children: user.cif_nif || "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-[var(--color-text-muted)]", children: "Email: " }),
            /* @__PURE__ */ jsx("span", { className: "text-[var(--color-navy)] font-medium", children: user.email })
          ] }),
          user.telefono && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-[var(--color-text-muted)]", children: "Telefono: " }),
            /* @__PURE__ */ jsx("span", { className: "text-[var(--color-navy)] font-medium", children: user.telefono })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-[var(--color-border)] rounded-lg p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-[var(--color-navy)] mb-4", children: "Direccion de envio" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Direccion de envio *" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: direccionEnvio,
                onChange: (e) => setDireccionEnvio(e.target.value),
                rows: 3,
                className: "w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]",
                placeholder: "Calle, numero, piso, codigo postal, ciudad, provincia"
              }
            ),
            !direccionEnvio && user.direccion_facturacion && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setDireccionEnvio(user.direccion_facturacion || ""),
                className: "mt-1 text-xs text-[var(--color-action)] hover:underline",
                children: "Usar direccion de facturacion"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm text-[var(--color-navy)]", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: mismaDir,
                onChange: (e) => setMismaDir(e.target.checked),
                className: "rounded border-[var(--color-border)]"
              }
            ),
            "La direccion de facturacion es la misma"
          ] }),
          !mismaDir && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Direccion de facturacion *" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: direccionFacturacion,
                onChange: (e) => setDireccionFacturacion(e.target.value),
                rows: 3,
                className: "w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]",
                placeholder: "Calle, numero, piso, codigo postal, ciudad, provincia"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Notas del pedido (opcional)" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: notasCliente,
                onChange: (e) => setNotasCliente(e.target.value),
                rows: 2,
                className: "w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]",
                placeholder: "Instrucciones especiales de entrega, referencia, etc."
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-[var(--color-border)] rounded-lg p-6", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-[var(--color-navy)] mb-4", children: [
          "Productos (",
          items.length,
          ")"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-[var(--color-navy)] truncate", children: item.nombre }),
            /* @__PURE__ */ jsxs("p", { className: "text-[var(--color-text-muted)]", children: [
              item.cantidad,
              " x ",
              formatCurrency(item.precioUnitario)
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-[var(--color-navy)] ml-4", children: formatCurrency(item.precioUnitario * item.cantidad) })
        ] }, item.productoId)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("a", { href: "/carrito", className: "px-6 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors", children: "Volver al carrito" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSubmit,
            disabled: loading,
            className: "flex-1 bg-[var(--color-action)] text-white py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50",
            children: loading ? "Procesando..." : "Enviar Pedido"
          }
        )
      ] }),
      error && /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700", children: error })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "w-full lg:w-80 flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "bg-white border border-[var(--color-border)] rounded-lg p-6 sticky top-28", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-[var(--color-navy)] mb-4", children: "Resumen" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-[var(--color-text-muted)]", children: [
            "Subtotal (",
            items.length,
            " prod.)"
          ] }),
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
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[var(--color-text-muted)]", children: "* Precios sin IVA. El IVA se calculara en la factura final." })
      ] })
    ] }) })
  ] });
}

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Checkout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Checkout;
  const user = Astro2.locals.user;
  if (!user) {
    return Astro2.redirect("/login?redirect=/checkout");
  }
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Checkout - Tienda Alcora" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> ${renderComponent($$result2, "Breadcrumb", $$Breadcrumb, { "items": [{ label: "Carrito", href: "/carrito" }, { label: "Checkout" }] })} <h1 class="text-2xl font-bold text-navy mt-4 mb-6">Finalizar pedido</h1> ${renderComponent($$result2, "CheckoutForm", CheckoutForm, { "client:load": true, "user": {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    razon_social: user.razon_social,
    cif_nif: user.cif_nif,
    telefono: user.telefono,
    direccion_envio: user.direccion_envio,
    direccion_facturacion: user.direccion_facturacion
  }, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/checkout/CheckoutForm", "client:component-export": "default" })} </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/checkout.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/checkout.astro";
const $$url = "/checkout";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Checkout,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
