/* empty css                                          */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_g9L0Gq9n.mjs';
import { directusAdmin } from '../../chunks/directus_tOieuaro.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState } from 'react';
export { renderers } from '../../renderers.mjs';

const STATUS_LABELS = {
  active: "Activo",
  suspended: "Pendiente",
  invited: "Invitado",
  draft: "Borrador"
};
const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-orange-100 text-orange-800",
  invited: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-700"
};
const GRUPOS = {
  distribuidor: "Distribuidor",
  empresa: "Empresa",
  hospital: "Hospital/Clínica",
  particular: "Particular"
};
const FILTER_TABS = [
  { value: "", label: "Todos" },
  { value: "suspended", label: "Pendientes activación" },
  { value: "active", label: "Activos" }
];
function formatDate(d) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
function UsuariosAdminPanel({
  usuariosInitial,
  estadoFilterInitial,
  emailFilterInitial,
  total,
  page,
  totalPages
}) {
  const [usuarios, setUsuarios] = useState(usuariosInitial);
  const [estadoFilter, setEstadoFilter] = useState(estadoFilterInitial);
  const [emailFilter, setEmailFilter] = useState(emailFilterInitial);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [msg, setMsg] = useState(null);
  function showMsg(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4e3);
  }
  function goToFilter(status) {
    const params = new URLSearchParams();
    if (status) params.set("estado", status);
    if (emailFilter) params.set("email", emailFilter);
    window.location.href = `/gestion/usuarios?${params.toString()}`;
  }
  function goToSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (estadoFilter) params.set("estado", estadoFilter);
    if (emailFilter) params.set("email", emailFilter);
    window.location.href = `/gestion/usuarios?${params.toString()}`;
  }
  async function cambiarEstado(userId, nuevoStatus) {
    setLoadingId(userId);
    try {
      const res = await fetch(`/gestion-api/usuarios/${userId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nuevoStatus })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error");
      }
      setUsuarios(
        (prev) => prev.map((u) => u.id === userId ? { ...u, status: nuevoStatus } : u)
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, status: nuevoStatus } : null);
      }
      showMsg("ok", nuevoStatus === "active" ? "Usuario activado" : nuevoStatus === "suspended" ? "Usuario suspendido" : "Estado actualizado");
    } catch (err) {
      showMsg("err", err.message || "Error al cambiar estado");
    } finally {
      setLoadingId(null);
    }
  }
  async function cambiarGrupo(userId, nuevoGrupo) {
    setLoadingId(userId);
    try {
      const res = await fetch(`/gestion-api/usuarios/${userId}/grupo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupo_cliente: nuevoGrupo })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error");
      }
      setUsuarios(
        (prev) => prev.map((u) => u.id === userId ? { ...u, grupo_cliente: nuevoGrupo } : u)
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, grupo_cliente: nuevoGrupo } : null);
      }
      showMsg("ok", "Grupo actualizado");
    } catch (err) {
      showMsg("err", err.message || "Error al cambiar grupo");
    } finally {
      setLoadingId(null);
    }
  }
  const nombreUsuario = (u) => u.razon_social || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    msg && /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${msg.type === "ok" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`, children: [
      /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: msg.type === "ok" ? "check_circle" : "error" }),
      msg.text
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: FILTER_TABS.map((f) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => goToFilter(f.value),
          className: `px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${estadoFilter === f.value ? "bg-action text-white border-action" : "bg-white text-navy border-border hover:border-action"}`,
          children: f.label
        },
        f.value
      )) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: goToSearch, className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: emailFilter,
            onChange: (e) => setEmailFilter(e.target.value),
            placeholder: "Buscar por email o nombre...",
            className: "text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-action w-56"
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "submit", className: "px-3 py-1.5 bg-action text-white text-sm rounded-lg hover:bg-action-hover transition-colors", children: "Buscar" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-5", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 bg-white border border-border rounded-xl overflow-hidden", children: usuarios.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-bg-light text-xs text-text-muted uppercase tracking-wide border-b border-border", children: [
            /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-semibold", children: "Usuario" }),
            /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-semibold hidden md:table-cell", children: "Empresa / CIF" }),
            /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-semibold hidden sm:table-cell", children: "Estado" }),
            /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-semibold hidden lg:table-cell", children: "Grupo" }),
            /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-semibold hidden lg:table-cell", children: "Alta" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: usuarios.map((u) => /* @__PURE__ */ jsxs(
            "tr",
            {
              className: `hover:bg-bg-light transition-colors cursor-pointer ${selectedUser?.id === u.id ? "bg-bg-accent" : ""}`,
              onClick: () => setSelectedUser(u),
              children: [
                /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-medium text-navy", children: nombreUsuario(u) }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-text-muted", children: u.email })
                ] }),
                /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 hidden md:table-cell", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-navy", children: u.razon_social || "—" }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-text-muted", children: u.cif_nif || "" })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 hidden sm:table-cell", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.status] || "bg-gray-100 text-gray-700"}`, children: STATUS_LABELS[u.status] || u.status }) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 hidden lg:table-cell text-text-muted text-xs capitalize", children: GRUPOS[u.grupo_cliente || ""] || u.grupo_cliente || "—" }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 hidden lg:table-cell text-text-muted text-xs whitespace-nowrap", children: u.date_created ? formatDate(u.date_created) : "—" }),
                /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right", children: [
                  u.status === "suspended" && /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        cambiarEstado(u.id, "active");
                      },
                      disabled: loadingId === u.id,
                      className: "px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium",
                      children: loadingId === u.id ? "..." : "Activar"
                    }
                  ),
                  u.status === "active" && /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        cambiarEstado(u.id, "suspended");
                      },
                      disabled: loadingId === u.id,
                      className: "px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium",
                      children: loadingId === u.id ? "..." : "Suspender"
                    }
                  )
                ] })
              ]
            },
            u.id
          )) })
        ] }) }),
        totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-t border-border bg-bg-light", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-text-muted", children: [
            "Página ",
            page,
            " de ",
            totalPages,
            " · ",
            total,
            " usuarios"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            page > 1 && /* @__PURE__ */ jsx(
              "a",
              {
                href: `/gestion/usuarios?${estadoFilter ? `estado=${estadoFilter}&` : ""}page=${page - 1}`,
                onClick: (e) => {
                  e.preventDefault();
                  window.location.href = `/gestion/usuarios?${estadoFilter ? `estado=${estadoFilter}&` : ""}page=${page - 1}`;
                },
                className: "px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-white transition-colors",
                children: "← Anterior"
              }
            ),
            page < totalPages && /* @__PURE__ */ jsx(
              "a",
              {
                href: `/gestion/usuarios?${estadoFilter ? `estado=${estadoFilter}&` : ""}page=${page + 1}`,
                onClick: (e) => {
                  e.preventDefault();
                  window.location.href = `/gestion/usuarios?${estadoFilter ? `estado=${estadoFilter}&` : ""}page=${page + 1}`;
                },
                className: "px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-white transition-colors",
                children: "Siguiente →"
              }
            )
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "py-16 text-center text-text-muted", children: [
        /* @__PURE__ */ jsx("span", { className: "material-icons text-4xl opacity-30 mb-3 block", children: "group" }),
        /* @__PURE__ */ jsx("p", { children: "No hay usuarios con este filtro" })
      ] }) }),
      selectedUser && /* @__PURE__ */ jsx("div", { className: "lg:w-72 flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-5 sticky top-4 space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-navy", children: "Detalle usuario" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setSelectedUser(null), className: "text-text-muted hover:text-navy", children: /* @__PURE__ */ jsx("span", { className: "material-icons text-lg", children: "close" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-navy text-base", children: nombreUsuario(selectedUser) }),
            /* @__PURE__ */ jsx("a", { href: `mailto:${selectedUser.email}`, className: "text-action hover:underline text-xs", children: selectedUser.email })
          ] }),
          selectedUser.razon_social && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-text-muted text-xs", children: "Empresa:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: selectedUser.razon_social })
          ] }),
          selectedUser.cif_nif && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-text-muted text-xs", children: "CIF/NIF:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: selectedUser.cif_nif })
          ] }),
          selectedUser.telefono && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-text-muted text-xs", children: "Teléf.:" }),
            " ",
            /* @__PURE__ */ jsx("a", { href: `tel:${selectedUser.telefono}`, className: "text-navy hover:text-action", children: selectedUser.telefono })
          ] }),
          selectedUser.tipo_negocio && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-text-muted text-xs", children: "Tipo negocio:" }),
            " ",
            /* @__PURE__ */ jsx("span", { children: selectedUser.tipo_negocio })
          ] }),
          (selectedUser.ciudad || selectedUser.provincia) && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-text-muted text-xs", children: "Ubicación:" }),
            " ",
            /* @__PURE__ */ jsx("span", { children: [selectedUser.ciudad, selectedUser.provincia].filter(Boolean).join(", ") })
          ] }),
          selectedUser.date_created && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-text-muted text-xs", children: "Alta:" }),
            " ",
            /* @__PURE__ */ jsx("span", { children: formatDate(selectedUser.date_created) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-text-muted uppercase tracking-wide mb-2", children: "Estado de cuenta" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: ["active", "suspended"].map((s) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => cambiarEstado(selectedUser.id, s),
              disabled: loadingId === selectedUser.id || selectedUser.status === s,
              className: `w-full px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${selectedUser.status === s ? `${STATUS_COLORS[s]} cursor-default border-transparent` : "bg-white border-border text-navy hover:border-action disabled:opacity-50"}`,
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: STATUS_LABELS[s] }),
                selectedUser.status === s && /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "check" })
              ] })
            },
            s
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-text-muted uppercase tracking-wide mb-2", children: "Grupo cliente" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: selectedUser.grupo_cliente || "",
              onChange: (e) => cambiarGrupo(selectedUser.id, e.target.value),
              disabled: loadingId === selectedUser.id,
              className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Sin grupo" }),
                Object.entries(GRUPOS).map(([val, label]) => /* @__PURE__ */ jsx("option", { value: val, children: label }, val))
              ]
            }
          ),
          loadingId === selectedUser.id && /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted mt-1", children: "Guardando..." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pt-2 border-t border-border", children: /* @__PURE__ */ jsxs(
          "a",
          {
            href: `/gestion/pedidos?email=${encodeURIComponent(selectedUser.email)}`,
            onClick: (e) => {
              e.preventDefault();
              window.location.href = `/gestion/pedidos?email=${encodeURIComponent(selectedUser.email)}`;
            },
            className: "flex items-center gap-2 text-sm text-action hover:underline",
            children: [
              /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "shopping_bag" }),
              "Ver pedidos de este usuario"
            ]
          }
        ) })
      ] }) })
    ] })
  ] });
}

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Usuarios = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Usuarios;
  const url = new URL(Astro2.request.url);
  const estadoFilter = url.searchParams.get("estado") || "";
  const emailFilter = url.searchParams.get("email") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 30;
  const offset = (page - 1) * limit;
  let usuarios = [];
  let total = 0;
  try {
    const filters = [];
    if (estadoFilter) filters.push(`filter[status][_eq]=${estadoFilter}`);
    if (emailFilter) filters.push(`search=${encodeURIComponent(emailFilter)}`);
    const qs = [
      `sort=-id`,
      `limit=${limit}`,
      `offset=${offset}`,
      `fields=id,email,first_name,last_name,status,grupo_cliente,razon_social,cif_nif,telefono,tipo_negocio,ciudad,provincia`,
      `meta=filter_count`,
      ...filters
    ].join("&");
    const res = await directusAdmin(`/users?${qs}`);
    usuarios = res.data || [];
    total = res.meta?.filter_count || 0;
  } catch (err) {
    console.error("[admin/usuarios] Error:", err);
  }
  const totalPages = Math.ceil(total / limit);
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Usuarios - Admin Alcora", "activeTab": "usuarios" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-5"> <!-- Header --> <div> <h1 class="text-2xl font-bold text-navy">Usuarios</h1> <p class="text-text-muted text-sm mt-0.5">${total} resultado${total !== 1 ? "s" : ""}</p> </div> <!-- Panel React interactivo --> ${renderComponent($$result2, "UsuariosAdminPanel", UsuariosAdminPanel, { "client:load": true, "usuariosInitial": usuarios, "estadoFilterInitial": estadoFilter, "emailFilterInitial": emailFilter, "total": total, "page": page, "totalPages": totalPages, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/admin/UsuariosAdminPanel", "client:component-export": "default" })} </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/gestion/usuarios.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/gestion/usuarios.astro";
const $$url = "/gestion/usuarios";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Usuarios,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
