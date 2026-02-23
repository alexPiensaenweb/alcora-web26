/* empty css                                          */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$AccountLayout } from '../../chunks/AccountLayout_BiXJYpTF.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
export { renderers } from '../../renderers.mjs';

function ProfileForm({ user }) {
  const [form, setForm] = useState(user);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/cuenta-api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          telefono: form.telefono,
          direccion_facturacion: form.direccion_facturacion,
          direccion_envio: form.direccion_envio
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar el perfil");
      }
      setMessage("Perfil actualizado correctamente");
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white border border-[var(--color-border)] rounded-lg p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-[var(--color-navy)] mb-4", children: "Datos personales" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Nombre" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.first_name,
              onChange: (e) => update("first_name", e.target.value),
              className: "w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Apellidos" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.last_name,
              onChange: (e) => update("last_name", e.target.value),
              className: "w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Telefono" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "tel",
              value: form.telefono,
              onChange: (e) => update("telefono", e.target.value),
              className: "w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Email" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              value: form.email,
              disabled: true,
              className: "w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-light)] text-[var(--color-text-muted)]"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white border border-[var(--color-border)] rounded-lg p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-[var(--color-navy)] mb-4", children: "Datos de empresa" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Razon social" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.razon_social,
              disabled: true,
              className: "w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-light)] text-[var(--color-text-muted)]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "CIF/NIF" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.cif_nif,
              disabled: true,
              className: "w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-light)] text-[var(--color-text-muted)]"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-[var(--color-text-muted)] mt-2", children: "Para modificar la razon social o CIF/NIF contacte con el administrador." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white border border-[var(--color-border)] rounded-lg p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-[var(--color-navy)] mb-4", children: "Direcciones" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Direccion de facturacion" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: form.direccion_facturacion,
              onChange: (e) => update("direccion_facturacion", e.target.value),
              rows: 3,
              className: "w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]",
              placeholder: "Calle, numero, piso, codigo postal, ciudad, provincia"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-[var(--color-navy)] mb-1", children: "Direccion de envio" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: form.direccion_envio,
              onChange: (e) => update("direccion_envio", e.target.value),
              rows: 3,
              className: "w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]",
              placeholder: "Calle, numero, piso, codigo postal, ciudad, provincia"
            }
          )
        ] })
      ] })
    ] }),
    message && /* @__PURE__ */ jsx("div", { className: "p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700", children: message }),
    error && /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700", children: error }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        disabled: loading,
        className: "bg-[var(--color-action)] text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50",
        children: loading ? "Guardando..." : "Guardar cambios"
      }
    ) })
  ] });
}

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Perfil = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Perfil;
  const user = Astro2.locals.user;
  return renderTemplate`${renderComponent($$result, "AccountLayout", $$AccountLayout, { "title": "Perfil - Tienda Alcora", "activeTab": "perfil" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div> <h2 class="text-xl font-bold text-navy mb-6">Mi Perfil</h2> ${renderComponent($$result2, "ProfileForm", ProfileForm, { "client:load": true, "user": {
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email,
    razon_social: user.razon_social || "",
    cif_nif: user.cif_nif || "",
    telefono: user.telefono || "",
    direccion_facturacion: user.direccion_facturacion || "",
    direccion_envio: user.direccion_envio || ""
  }, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/account/ProfileForm", "client:component-export": "default" })} </div> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/cuenta/perfil.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/cuenta/perfil.astro";
const $$url = "/cuenta/perfil";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Perfil,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
