/* empty css                                             */
import { f as createComponent, k as renderComponent, r as renderTemplate } from '../../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../chunks/AdminLayout_g9L0Gq9n.mjs';
import { directusAdmin } from '../../../chunks/directus_tOieuaro.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useRef } from 'react';
export { renderers } from '../../../renderers.mjs';

function NuevoProductoForm({ categorias, marcas }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState({
    imagen: null,
    ficha_tecnica: null,
    ficha_seguridad: null
  });
  const imgInputRef = useRef(null);
  const ftInputRef = useRef(null);
  const fsInputRef = useRef(null);
  const [form, setForm] = useState({
    sku: "",
    nombre: "",
    precio_base: "",
    stock: "-1",
    extracto: "",
    descripcion: "",
    formato: "",
    unidad_venta: "",
    marca: "",
    categoria: "",
    marca_id: "",
    status: "draft"
  });
  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  function handleFileSelect(field, accept) {
    return (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        setError("El archivo no puede superar 10MB");
        return;
      }
      setError("");
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFiles((prev) => ({ ...prev, [field]: { file, preview: reader.result } }));
        };
        reader.readAsDataURL(file);
        return;
      }
      setFiles((prev) => ({ ...prev, [field]: { file, preview: null } }));
    };
  }
  function removeFile(field) {
    setFiles((prev) => ({ ...prev, [field]: null }));
    const ref = field === "imagen" ? imgInputRef : field === "ficha_tecnica" ? ftInputRef : fsInputRef;
    if (ref.current) ref.current.value = "";
  }
  async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/gestion-api/upload", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir archivo");
    return data.data?.id;
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.sku.trim() || !form.nombre.trim() || !form.precio_base.trim()) {
      setError("SKU, nombre y precio base son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const uploads = {};
      if (files.imagen) {
        uploads.imagen_principal = await uploadFile(files.imagen.file);
      }
      if (files.ficha_tecnica) {
        uploads.ficha_tecnica = await uploadFile(files.ficha_tecnica.file);
      }
      if (files.ficha_seguridad) {
        uploads.ficha_seguridad = await uploadFile(files.ficha_seguridad.file);
      }
      const payload = {
        sku: form.sku.trim(),
        nombre: form.nombre.trim(),
        precio_base: parseFloat(form.precio_base),
        stock: parseInt(form.stock) || -1,
        status: form.status,
        ...uploads
      };
      if (form.extracto.trim()) payload.extracto = form.extracto.trim();
      if (form.descripcion.trim()) payload.descripcion = form.descripcion.trim();
      if (form.formato.trim()) payload.formato = form.formato.trim();
      if (form.unidad_venta.trim()) payload.unidad_venta = form.unidad_venta.trim();
      if (form.marca.trim()) payload.marca = form.marca.trim();
      if (form.categoria) payload.categoria = parseInt(form.categoria);
      if (form.marca_id) payload.marca_id = parseInt(form.marca_id);
      const res = await fetch("/gestion-api/productos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear producto");
      window.location.href = "/gestion/productos";
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-navy", children: "Nuevo producto" }),
        /* @__PURE__ */ jsx("p", { className: "text-text-muted text-sm mt-1", children: "Crea un nuevo producto en el catálogo" })
      ] }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/gestion/productos",
          onClick: (e) => {
            e.preventDefault();
            window.location.href = "/gestion/productos";
          },
          className: "inline-flex items-center gap-1 text-text-muted hover:text-action text-sm transition-colors",
          children: [
            /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "arrow_back" }),
            "Volver a productos"
          ]
        }
      )
    ] }),
    error && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mb-5", children: [
      /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "error" }),
      error
    ] }),
    /* @__PURE__ */ jsx("form", { onSubmit: handleSubmit, children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-5 space-y-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-navy text-sm uppercase tracking-wide", children: "Datos principales" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-navy mb-1", children: [
                "SKU ",
                /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: form.sku,
                  onChange: (e) => set("sku", e.target.value),
                  placeholder: "Ej: PROD-001",
                  className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-navy mb-1", children: [
                "Precio base (sin IVA) ",
                /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    step: "0.01",
                    min: "0",
                    value: form.precio_base,
                    onChange: (e) => set("precio_base", e.target.value),
                    placeholder: "0.00",
                    className: "w-full text-sm border border-border rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-action",
                    required: true
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm", children: "€" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-navy mb-1", children: [
              "Nombre ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: form.nombre,
                onChange: (e) => set("nombre", e.target.value),
                placeholder: "Nombre del producto",
                className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-navy mb-1", children: "Extracto" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: form.extracto,
                onChange: (e) => set("extracto", e.target.value),
                placeholder: "Descripción corta para listados (max 200 caracteres)",
                maxLength: 200,
                className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-navy mb-1", children: "Descripción" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: form.descripcion,
                onChange: (e) => set("descripcion", e.target.value),
                placeholder: "Descripción completa del producto...",
                rows: 4,
                className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action resize-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-5 space-y-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-navy text-sm uppercase tracking-wide", children: "Detalles" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-navy mb-1", children: "Stock" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: form.stock,
                  onChange: (e) => set("stock", e.target.value),
                  className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted mt-1", children: "-1 = ilimitado" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-navy mb-1", children: "Formato" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: form.formato,
                  onChange: (e) => set("formato", e.target.value),
                  placeholder: "Ej: Bote 1L",
                  className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-navy mb-1", children: "Unidad venta" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: form.unidad_venta,
                  onChange: (e) => set("unidad_venta", e.target.value),
                  placeholder: "Ej: Caja 6 uds",
                  className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-navy mb-1", children: "Categoría" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: form.categoria,
                  onChange: (e) => set("categoria", e.target.value),
                  className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action bg-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Sin categoría" }),
                    categorias.map((c) => /* @__PURE__ */ jsxs("option", { value: c.id, children: [
                      c.parent ? "— " : "",
                      c.nombre
                    ] }, c.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-navy mb-1", children: "Marca" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: form.marca_id,
                  onChange: (e) => set("marca_id", e.target.value),
                  className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action bg-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Sin marca" }),
                    marcas.map((m) => /* @__PURE__ */ jsx("option", { value: m.id, children: m.nombre }, m.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-navy mb-1", children: "Estado" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: form.status,
                  onChange: (e) => set("status", e.target.value),
                  className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action bg-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "draft", children: "Borrador" }),
                    /* @__PURE__ */ jsx("option", { value: "published", children: "Publicado" })
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: saving,
              className: "px-6 py-2.5 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover disabled:opacity-50 transition-colors",
              children: saving ? "Creando producto..." : "Crear producto"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/gestion/productos",
              onClick: (e) => {
                e.preventDefault();
                window.location.href = "/gestion/productos";
              },
              className: "px-6 py-2.5 border border-border text-navy rounded-lg text-sm font-medium hover:border-action hover:text-action transition-colors",
              children: "Cancelar"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-navy text-sm uppercase tracking-wide mb-3", children: "Imagen principal" }),
          /* @__PURE__ */ jsx("input", { ref: imgInputRef, type: "file", accept: "image/*", className: "hidden", onChange: handleFileSelect("imagen") }),
          files.imagen?.preview ? /* @__PURE__ */ jsxs("div", { className: "relative aspect-square rounded-lg overflow-hidden border border-border bg-bg-light", children: [
            /* @__PURE__ */ jsx("img", { src: files.imagen.preview, alt: "Preview", className: "w-full h-full object-cover" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => removeFile("imagen"),
                className: "absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow",
                children: /* @__PURE__ */ jsx("span", { className: "material-icons text-sm", children: "close" })
              }
            )
          ] }) : /* @__PURE__ */ jsx(
            "div",
            {
              className: "aspect-square rounded-lg border-2 border-dashed border-border hover:border-action bg-bg-light flex items-center justify-center cursor-pointer transition-colors",
              onClick: () => imgInputRef.current?.click(),
              children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("span", { className: "material-icons text-4xl text-text-muted", children: "add_photo_alternate" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-text-muted mt-2", children: "Haz clic para añadir" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted mt-1", children: "JPG, PNG, WebP · Max 10MB" })
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-navy text-xs uppercase tracking-wide mb-2", children: "Ficha técnica" }),
            /* @__PURE__ */ jsx("input", { ref: ftInputRef, type: "file", accept: ".pdf,.doc,.docx", className: "hidden", onChange: handleFileSelect("ficha_tecnica") }),
            files.ficha_tecnica ? /* @__PURE__ */ jsxs("div", { className: "relative aspect-square rounded-lg border border-border bg-bg-light flex items-center justify-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("span", { className: "material-icons text-2xl text-action", children: "description" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-navy mt-1 truncate max-w-full px-1", children: files.ficha_tecnica.file.name })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => removeFile("ficha_tecnica"),
                  className: "absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors",
                  children: /* @__PURE__ */ jsx("span", { className: "material-icons text-xs", children: "close" })
                }
              )
            ] }) : /* @__PURE__ */ jsx(
              "div",
              {
                className: "aspect-square rounded-lg border-2 border-dashed border-border hover:border-action bg-bg-light flex items-center justify-center cursor-pointer transition-colors",
                onClick: () => ftInputRef.current?.click(),
                children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "material-icons text-2xl text-text-muted", children: "upload_file" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted mt-1", children: "PDF" })
                ] })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-navy text-xs uppercase tracking-wide mb-2", children: "Ficha seguridad" }),
            /* @__PURE__ */ jsx("input", { ref: fsInputRef, type: "file", accept: ".pdf,.doc,.docx", className: "hidden", onChange: handleFileSelect("ficha_seguridad") }),
            files.ficha_seguridad ? /* @__PURE__ */ jsxs("div", { className: "relative aspect-square rounded-lg border border-border bg-bg-light flex items-center justify-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("span", { className: "material-icons text-2xl text-action", children: "verified_user" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-navy mt-1 truncate max-w-full px-1", children: files.ficha_seguridad.file.name })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => removeFile("ficha_seguridad"),
                  className: "absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors",
                  children: /* @__PURE__ */ jsx("span", { className: "material-icons text-xs", children: "close" })
                }
              )
            ] }) : /* @__PURE__ */ jsx(
              "div",
              {
                className: "aspect-square rounded-lg border-2 border-dashed border-border hover:border-action bg-bg-light flex items-center justify-center cursor-pointer transition-colors",
                onClick: () => fsInputRef.current?.click(),
                children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "material-icons text-2xl text-text-muted", children: "upload_file" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted mt-1", children: "PDF" })
                ] })
              }
            )
          ] })
        ] })
      ] })
    ] }) })
  ] });
}

const $$Nuevo = createComponent(async ($$result, $$props, $$slots) => {
  let categorias = [];
  let marcas = [];
  try {
    const [catRes, marcaRes] = await Promise.all([
      directusAdmin("/items/categorias?sort=nombre&fields=id,nombre,parent&limit=200"),
      directusAdmin("/items/marcas?sort=nombre&fields=id,nombre&limit=100")
    ]);
    categorias = catRes.data || [];
    marcas = marcaRes.data || [];
  } catch (err) {
    console.error("[admin/productos/nuevo] Error:", err);
  }
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Nuevo Producto - Admin Alcora", "activeTab": "productos" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "NuevoProductoForm", NuevoProductoForm, { "client:load": true, "categorias": categorias, "marcas": marcas, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/admin/NuevoProductoForm", "client:component-export": "default" })} ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/gestion/productos/nuevo.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/gestion/productos/nuevo.astro";
const $$url = "/gestion/productos/nuevo";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Nuevo,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
