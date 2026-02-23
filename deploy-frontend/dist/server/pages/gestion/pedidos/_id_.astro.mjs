/* empty css                                             */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../chunks/AdminLayout_g9L0Gq9n.mjs';
import { directusAdmin } from '../../../chunks/directus_tOieuaro.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
export { renderers } from '../../../renderers.mjs';

const ESTADOS = [
  { value: "solicitado", label: "Solicitado", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "presupuesto_solicitado", label: "Presupuesto solicitado", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "aprobado_pendiente_pago", label: "Aprobado - Pte. pago", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "pagado", label: "Pagado", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "enviado", label: "Enviado", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200" }
];
function formatDate(d) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function PedidoAdminPanel({ pedido: initialPedido }) {
  const [pedido, setPedido] = useState(initialPedido);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");
  const [notasAdmin, setNotasAdmin] = useState(initialPedido.notas_admin || "");
  const estadoActual = ESTADOS.find((e) => e.value === pedido.estado);
  const clienteNombre = pedido.user_created ? pedido.user_created.razon_social || `${pedido.user_created.first_name || ""} ${pedido.user_created.last_name || ""}`.trim() || pedido.user_created.email : "—";
  async function cambiarEstado(nuevoEstado) {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const res = await fetch(`/gestion-api/pedidos/${pedido.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al cambiar estado");
      }
      setPedido((prev) => ({ ...prev, estado: nuevoEstado }));
      setSavedMsg("Estado actualizado correctamente");
      setTimeout(() => setSavedMsg(""), 3e3);
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setSaving(false);
    }
  }
  async function guardarNotas() {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const res = await fetch(`/gestion-api/pedidos/${pedido.id}/notas`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notas_admin: notasAdmin })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al guardar notas");
      }
      setPedido((prev) => ({ ...prev, notas_admin: notasAdmin }));
      setSavedMsg("Notas guardadas");
      setTimeout(() => setSavedMsg(""), 3e3);
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs(
      "a",
      {
        href: "/gestion/pedidos",
        onClick: (e) => {
          e.preventDefault();
          window.location.href = "/gestion/pedidos";
        },
        className: "inline-flex items-center gap-1 text-sm text-text-muted hover:text-action transition-colors",
        children: [
          /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "arrow_back" }),
          "Volver a pedidos"
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-navy", children: [
          "Pedido #",
          pedido.id
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-text-muted text-sm mt-1", children: formatDate(pedido.date_created) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: `px-3 py-1.5 rounded-full text-sm font-semibold border ${estadoActual?.color || "bg-gray-100 text-gray-700 border-gray-200"}`, children: estadoActual?.label || pedido.estado })
    ] }),
    savedMsg && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm", children: [
      /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "check_circle" }),
      savedMsg
    ] }),
    error && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm", children: [
      /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "error" }),
      error
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "px-5 py-4 border-b border-border", children: /* @__PURE__ */ jsx("h2", { className: "font-semibold text-navy", children: "Productos del pedido" }) }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-bg-light text-xs text-text-muted uppercase tracking-wide", children: [
              /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-semibold", children: "Producto" }),
              /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-semibold", children: "SKU" }),
              /* @__PURE__ */ jsx("th", { className: "text-center px-4 py-3 font-semibold", children: "Uds." }),
              /* @__PURE__ */ jsx("th", { className: "text-right px-4 py-3 font-semibold", children: "Precio ud." }),
              /* @__PURE__ */ jsx("th", { className: "text-right px-4 py-3 font-semibold", children: "Subtotal" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: pedido.items?.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium text-navy", children: item.nombre_producto }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-text-muted", children: item.sku }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center", children: item.cantidad }),
              /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right", children: [
                Number(item.precio_unitario || 0).toFixed(2),
                " €"
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right font-semibold", children: [
                Number(item.subtotal || 0).toFixed(2),
                " €"
              ] })
            ] }, item.id)) })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-t border-border bg-bg-light space-y-1 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-text-muted", children: [
              /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
              /* @__PURE__ */ jsxs("span", { children: [
                Number(pedido.subtotal || 0).toFixed(2),
                " €"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-text-muted", children: [
              /* @__PURE__ */ jsx("span", { children: "Envío" }),
              /* @__PURE__ */ jsx("span", { children: Number(pedido.costo_envio || 0) === 0 ? "Gratis" : `${Number(pedido.costo_envio || 0).toFixed(2)} €` })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-navy text-base pt-1 border-t border-border", children: [
              /* @__PURE__ */ jsx("span", { children: "Total (sin IVA)" }),
              /* @__PURE__ */ jsxs("span", { children: [
                Number(pedido.total || 0).toFixed(2),
                " €"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold text-text-muted uppercase tracking-wide mb-3", children: "Dirección de envío" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-navy", children: pedido.direccion_envio || "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-5", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold text-text-muted uppercase tracking-wide mb-3", children: "Dirección de facturación" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-navy", children: pedido.direccion_facturacion || "—" })
          ] })
        ] }),
        pedido.notas_cliente && /* @__PURE__ */ jsxs("div", { className: "bg-bg-accent border border-action/20 rounded-xl p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold text-action uppercase tracking-wide mb-2", children: "Notas del cliente" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-navy", children: pedido.notas_cliente })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold text-text-muted uppercase tracking-wide mb-3", children: "Notas internas" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: notasAdmin,
              onChange: (e) => setNotasAdmin(e.target.value),
              placeholder: "Notas internas del pedido (solo visibles para administradores)...",
              rows: 3,
              className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action resize-none"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: guardarNotas,
              disabled: saving,
              className: "mt-2 px-4 py-2 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover disabled:opacity-50 transition-colors",
              children: saving ? "Guardando..." : "Guardar notas"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-navy mb-4", children: "Cambiar estado" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: ESTADOS.map((e) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => cambiarEstado(e.value),
              disabled: saving || e.value === pedido.estado,
              className: `w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${e.value === pedido.estado ? `${e.color} cursor-default` : "bg-white border-border text-navy hover:border-action hover:text-action disabled:opacity-50"}`,
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: e.label }),
                e.value === pedido.estado && /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "check" })
              ] })
            },
            e.value
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold text-text-muted uppercase tracking-wide mb-3", children: "Información de pago" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-text-muted", children: "Método:" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-navy capitalize", children: pedido.metodo_pago === "transferencia" ? "Transferencia" : pedido.metodo_pago === "tarjeta" ? "Tarjeta" : "—" })
            ] }),
            pedido.referencia_pago && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-text-muted", children: "Referencia:" }),
              /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-navy", children: pedido.referencia_pago })
            ] })
          ] })
        ] }),
        pedido.user_created && /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold text-text-muted uppercase tracking-wide mb-3", children: "Cliente" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-navy", children: clienteNombre }),
            pedido.user_created.cif_nif && /* @__PURE__ */ jsxs("p", { className: "text-text-muted", children: [
              "CIF/NIF: ",
              pedido.user_created.cif_nif
            ] }),
            /* @__PURE__ */ jsx("a", { href: `mailto:${pedido.user_created.email}`, className: "text-action hover:underline block", children: pedido.user_created.email }),
            pedido.user_created.telefono && /* @__PURE__ */ jsx("a", { href: `tel:${pedido.user_created.telefono}`, className: "text-text-muted hover:text-navy block", children: pedido.user_created.telefono }),
            pedido.user_created.grupo_cliente && /* @__PURE__ */ jsx("span", { className: "inline-block mt-1 px-2 py-0.5 bg-bg-accent text-action text-xs rounded-full font-medium capitalize", children: pedido.user_created.grupo_cliente }),
            /* @__PURE__ */ jsx("div", { className: "pt-2 border-t border-border", children: /* @__PURE__ */ jsx(
              "a",
              {
                href: `/gestion/usuarios?email=${encodeURIComponent(pedido.user_created.email)}`,
                onClick: (e) => {
                  e.preventDefault();
                  window.location.href = `/gestion/usuarios?email=${encodeURIComponent(pedido.user_created.email)}`;
                },
                className: "text-xs text-action hover:underline",
                children: "Ver perfil de usuario →"
              }
            ) })
          ] })
        ] })
      ] })
    ] })
  ] });
}

const $$Astro = createAstro("https://tienda.alcora.es");
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  if (!id) return Astro2.redirect("/gestion/pedidos");
  let pedido = null;
  try {
    const res = await directusAdmin(
      `/items/pedidos/${id}?fields=*,items.*,items.producto.nombre,items.producto.sku,items.producto.imagen_principal,user_created.id,user_created.first_name,user_created.last_name,user_created.email,user_created.razon_social,user_created.cif_nif,user_created.telefono,user_created.grupo_cliente,user_created.direccion_envio,user_created.direccion_facturacion`
    );
    pedido = res.data;
  } catch (err) {
    console.error("[admin/pedidos/id] Error:", err);
  }
  if (!pedido) return Astro2.redirect("/gestion/pedidos");
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": `Pedido #${id} - Admin Alcora`, "activeTab": "pedidos" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-5"> <!-- Breadcrumb --> <div class="flex items-center gap-2 text-sm text-text-muted"> <a href="/gestion/pedidos" class="hover:text-action transition-colors">Pedidos</a> <span>/</span> <span class="text-navy font-medium">#${id}</span> </div> <!-- Panel interactivo (React island) --> ${renderComponent($$result2, "PedidoAdminPanel", PedidoAdminPanel, { "client:load": true, "pedido": pedido, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/admin/PedidoAdminPanel", "client:component-export": "default" })} </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/gestion/pedidos/[id].astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/gestion/pedidos/[id].astro";
const $$url = "/gestion/pedidos/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
