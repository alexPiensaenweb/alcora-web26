/* empty css                                       */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BgOPDYG0.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { lazy, useState, useEffect, Suspense } from 'react';
export { renderers } from '../renderers.mjs';

const Turnstile = lazy(() => import('react-turnstile'));
function getTurnstileSiteKey() {
  if (typeof window !== "undefined" && window.__TURNSTILE_SITE_KEY) {
    return window.__TURNSTILE_SITE_KEY;
  }
  return "1x00000000000000000000AA";
}
const TIPO_NEGOCIO_OPTIONS = [
  { value: "", label: "Seleccione tipo de negocio..." },
  { value: "control_plagas", label: "Control de plagas" },
  { value: "limpieza", label: "Limpieza profesional" },
  { value: "horeca", label: "Hostelería / HORECA" },
  { value: "sanidad", label: "Sanidad / Hospital" },
  { value: "alimentaria", label: "Industria alimentaria" },
  { value: "ambiental", label: "Gestión ambiental" },
  { value: "distribucion", label: "Distribución" },
  { value: "otro", label: "Otro" }
];
const PROVINCIAS = [
  "Álava",
  "Albacete",
  "Alicante",
  "Almería",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Barcelona",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ciudad Real",
  "Córdoba",
  "Cuenca",
  "Gerona",
  "Granada",
  "Guadalajara",
  "Guipúzcoa",
  "Huelva",
  "Huesca",
  "Islas Baleares",
  "Jaén",
  "La Coruña",
  "La Rioja",
  "Las Palmas",
  "León",
  "Lérida",
  "Lugo",
  "Madrid",
  "Málaga",
  "Murcia",
  "Navarra",
  "Orense",
  "Palencia",
  "Pontevedra",
  "Salamanca",
  "Santa Cruz de Tenerife",
  "Segovia",
  "Sevilla",
  "Soria",
  "Tarragona",
  "Teruel",
  "Toledo",
  "Valencia",
  "Valladolid",
  "Vizcaya",
  "Zamora",
  "Zaragoza",
  "Ceuta",
  "Melilla"
];
function validateField(name, value, form) {
  switch (name) {
    case "first_name":
      return value.trim() ? "" : "El nombre es obligatorio";
    case "last_name":
      return value.trim() ? "" : "Los apellidos son obligatorios";
    case "email": {
      if (!value.trim()) return "El email es obligatorio";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Formato de email no válido";
    }
    case "password": {
      if (!value) return "La contraseña es obligatoria";
      if (value.length < 8) return "Mínimo 8 caracteres";
      if (!/[A-Z]/.test(value)) return "Debe incluir al menos una mayúscula";
      if (!/[a-z]/.test(value)) return "Debe incluir al menos una minúscula";
      if (!/[0-9]/.test(value)) return "Debe incluir al menos un número";
      return "";
    }
    case "password_confirm":
      return value === form?.password ? "" : "Las contraseñas no coinciden";
    case "razon_social":
      return value.trim() ? "" : "La razón social es obligatoria";
    case "cif_nif": {
      if (!value.trim()) return "El CIF/NIF es obligatorio";
      return /^[A-Za-z]\d{7,8}[A-Za-z0-9]?$|^\d{8}[A-Za-z]$/.test(value.trim()) ? "" : "Formato no válido (ej: B12345678 o 12345678A)";
    }
    case "telefono":
      return value.trim() ? "" : "El teléfono es obligatorio";
    case "tipo_negocio":
      return value ? "" : "Seleccione el tipo de negocio";
    case "direccion_facturacion":
      return value.trim() ? "" : "La dirección es obligatoria";
    case "codigo_postal": {
      if (!value.trim()) return "El código postal es obligatorio";
      return /^\d{5}$/.test(value.trim()) ? "" : "Debe tener 5 dígitos";
    }
    case "ciudad":
      return value.trim() ? "" : "La ciudad es obligatoria";
    case "provincia":
      return value ? "" : "Seleccione una provincia";
    default:
      return "";
  }
}
function RegisterForm() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirm: "",
    razon_social: "",
    cif_nif: "",
    telefono: "",
    cargo: "",
    tipo_negocio: "",
    direccion_facturacion: "",
    ciudad: "",
    provincia: "",
    codigo_postal: "",
    acepta_proteccion_datos: false,
    acepta_comunicaciones: false
  });
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  function updateField(field, value) {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    if (touched[field] && typeof value === "string") {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value, newForm)
      }));
    }
    if (field === "password" && touched["password_confirm"]) {
      setFieldErrors((prev) => ({
        ...prev,
        password_confirm: validateField("password_confirm", newForm.password_confirm, newForm)
      }));
    }
  }
  function handleBlur(field, value) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value, form)
    }));
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    const requiredFields = [
      "first_name",
      "last_name",
      "email",
      "password",
      "password_confirm",
      "razon_social",
      "cif_nif",
      "telefono",
      "tipo_negocio",
      "direccion_facturacion",
      "codigo_postal",
      "ciudad",
      "provincia"
    ];
    const newErrors = {};
    let hasErrors = false;
    for (const field of requiredFields) {
      const err = validateField(field, form[field], form);
      if (err) {
        newErrors[field] = err;
        hasErrors = true;
      }
    }
    setFieldErrors(newErrors);
    setTouched(Object.fromEntries(requiredFields.map((f) => [f, true])));
    if (hasErrors) {
      setSubmitError("Corrija los errores indicados antes de continuar");
      return;
    }
    if (!form.acepta_proteccion_datos) {
      setSubmitError("Debe aceptar la política de protección de datos");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/cuenta-api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken })
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Error al enviar la solicitud");
        return;
      }
      setSuccess(true);
    } catch {
      setSubmitError("Error de conexión. Inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  }
  if (success) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center p-8 sm:p-12 bg-green-50 border border-green-200 rounded-xl", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-green-800 mb-3", children: "Solicitud enviada correctamente" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-green-700 max-w-md mx-auto leading-relaxed", children: "Hemos recibido su solicitud de registro. Nuestro equipo revisará su información y activará su cuenta en las próximas horas hábiles. Recibirá un email cuando su cuenta esté activa." }),
      /* @__PURE__ */ jsx("a", { href: "/", className: "inline-block mt-6 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors", children: "Volver al inicio" })
    ] });
  }
  const inputBase = "w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-[var(--color-text-muted)]/60";
  const inputOk = `${inputBase} border-[var(--color-border)] focus:border-[var(--color-action)] focus:ring-[var(--color-action)]/20`;
  const inputErr = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50`;
  const inputValid = `${inputBase} border-green-400 focus:border-green-500 focus:ring-green-200`;
  const labelClass = "block text-sm font-medium text-[var(--color-navy)] mb-1.5";
  function fieldClass(name, value) {
    if (!touched[name]) return inputOk;
    if (fieldErrors[name]) return inputErr;
    if (value) return inputValid;
    return inputOk;
  }
  function FieldError({ name }) {
    if (!touched[name] || !fieldErrors[name]) return null;
    return /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-red-600 flex items-center gap-1", children: [
      /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) }),
      fieldErrors[name]
    ] });
  }
  function FieldOk({ name, value }) {
    if (!touched[name] || fieldErrors[name] || !value) return null;
    return /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-green-600 flex items-center gap-1", children: [
      /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
      "Correcto"
    ] });
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-8 max-w-xl mx-auto", children: [
    submitError && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" }) }),
      submitError
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("span", { className: "w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0", children: "1" }),
        /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-[var(--color-navy)]", children: "Datos personales" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 pl-11", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Nombre *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.first_name,
              onChange: (e) => updateField("first_name", e.target.value),
              onBlur: (e) => handleBlur("first_name", e.target.value),
              className: fieldClass("first_name", form.first_name),
              placeholder: "Juan"
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "first_name" }),
          /* @__PURE__ */ jsx(FieldOk, { name: "first_name", value: form.first_name })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Apellidos *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.last_name,
              onChange: (e) => updateField("last_name", e.target.value),
              onBlur: (e) => handleBlur("last_name", e.target.value),
              className: fieldClass("last_name", form.last_name),
              placeholder: "Garcia Lopez"
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "last_name" }),
          /* @__PURE__ */ jsx(FieldOk, { name: "last_name", value: form.last_name })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Email corporativo *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              value: form.email,
              onChange: (e) => updateField("email", e.target.value),
              onBlur: (e) => handleBlur("email", e.target.value),
              className: fieldClass("email", form.email),
              placeholder: "empresa@ejemplo.com"
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "email" }),
          /* @__PURE__ */ jsx(FieldOk, { name: "email", value: form.email })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("span", { className: "w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0", children: "2" }),
        /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-[var(--color-navy)]", children: "Datos de empresa" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 pl-11", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Razón Social / Empresa *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.razon_social,
              onChange: (e) => updateField("razon_social", e.target.value),
              onBlur: (e) => handleBlur("razon_social", e.target.value),
              className: fieldClass("razon_social", form.razon_social),
              placeholder: "Empresa S.L."
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "razon_social" }),
          /* @__PURE__ */ jsx(FieldOk, { name: "razon_social", value: form.razon_social })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "CIF / NIF *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.cif_nif,
              onChange: (e) => updateField("cif_nif", e.target.value),
              onBlur: (e) => handleBlur("cif_nif", e.target.value),
              className: fieldClass("cif_nif", form.cif_nif),
              placeholder: "B12345678"
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "cif_nif" }),
          /* @__PURE__ */ jsx(FieldOk, { name: "cif_nif", value: form.cif_nif })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Teléfono *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "tel",
              value: form.telefono,
              onChange: (e) => updateField("telefono", e.target.value),
              onBlur: (e) => handleBlur("telefono", e.target.value),
              className: fieldClass("telefono", form.telefono),
              placeholder: "976 123 456"
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "telefono" }),
          /* @__PURE__ */ jsx(FieldOk, { name: "telefono", value: form.telefono })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Tipo de negocio *" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: form.tipo_negocio,
              onChange: (e) => updateField("tipo_negocio", e.target.value),
              onBlur: (e) => handleBlur("tipo_negocio", e.target.value),
              className: fieldClass("tipo_negocio", form.tipo_negocio),
              children: TIPO_NEGOCIO_OPTIONS.map((opt) => /* @__PURE__ */ jsx("option", { value: opt.value, children: opt.label }, opt.value))
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "tipo_negocio" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: labelClass, children: [
            "Cargo ",
            /* @__PURE__ */ jsx("span", { className: "text-[var(--color-text-muted)] font-normal", children: "(opcional)" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.cargo,
              onChange: (e) => updateField("cargo", e.target.value),
              className: inputOk,
              placeholder: "Responsable de compras"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("span", { className: "w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0", children: "3" }),
        /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-[var(--color-navy)]", children: "Dirección" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 pl-11", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Calle, número, piso *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.direccion_facturacion,
              onChange: (e) => updateField("direccion_facturacion", e.target.value),
              onBlur: (e) => handleBlur("direccion_facturacion", e.target.value),
              className: fieldClass("direccion_facturacion", form.direccion_facturacion),
              placeholder: "Calle Mayor 15, 2o B"
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "direccion_facturacion" }),
          /* @__PURE__ */ jsx(FieldOk, { name: "direccion_facturacion", value: form.direccion_facturacion })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Código postal *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.codigo_postal,
              onChange: (e) => updateField("codigo_postal", e.target.value),
              onBlur: (e) => handleBlur("codigo_postal", e.target.value),
              className: fieldClass("codigo_postal", form.codigo_postal),
              placeholder: "50000",
              maxLength: 5
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "codigo_postal" }),
          /* @__PURE__ */ jsx(FieldOk, { name: "codigo_postal", value: form.codigo_postal })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Ciudad *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.ciudad,
              onChange: (e) => updateField("ciudad", e.target.value),
              onBlur: (e) => handleBlur("ciudad", e.target.value),
              className: fieldClass("ciudad", form.ciudad),
              placeholder: "Zaragoza"
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "ciudad" }),
          /* @__PURE__ */ jsx(FieldOk, { name: "ciudad", value: form.ciudad })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Provincia *" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: form.provincia,
              onChange: (e) => updateField("provincia", e.target.value),
              onBlur: (e) => handleBlur("provincia", e.target.value),
              className: fieldClass("provincia", form.provincia),
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Seleccione provincia..." }),
                PROVINCIAS.map((prov) => /* @__PURE__ */ jsx("option", { value: prov, children: prov }, prov))
              ]
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "provincia" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("span", { className: "w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0", children: "4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-[var(--color-navy)]", children: "Contraseña de acceso" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 pl-11", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Contraseña *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              value: form.password,
              onChange: (e) => updateField("password", e.target.value),
              onBlur: (e) => handleBlur("password", e.target.value),
              className: fieldClass("password", form.password),
              placeholder: "Crea tu contraseña"
            }
          ),
          form.password.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 p-3 bg-[var(--color-bg-light)] rounded-lg grid grid-cols-2 gap-1.5", children: [
            { ok: form.password.length >= 8, label: "Mínimo 8 caracteres" },
            { ok: /[A-Z]/.test(form.password), label: "Una mayúscula" },
            { ok: /[a-z]/.test(form.password), label: "Una minúscula" },
            { ok: /[0-9]/.test(form.password), label: "Un número" }
          ].map(({ ok, label }) => /* @__PURE__ */ jsxs("span", { className: `flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-[var(--color-text-muted)]"}`, children: [
            ok ? /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }) : /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "9", strokeWidth: "2" }) }),
            label
          ] }, label)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: labelClass, children: "Confirmar contraseña *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              value: form.password_confirm,
              onChange: (e) => updateField("password_confirm", e.target.value),
              onBlur: (e) => handleBlur("password_confirm", e.target.value),
              className: fieldClass("password_confirm", form.password_confirm),
              placeholder: "Repite la contraseña"
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { name: "password_confirm" }),
          form.password_confirm.length > 0 && !fieldErrors["password_confirm"] && form.password === form.password_confirm && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-green-600 flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }),
            "Las contraseñas coinciden"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-t border-[var(--color-border)] pt-6 space-y-4", children: [
      /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-3 text-sm text-[var(--color-navy)] cursor-pointer p-3 rounded-lg hover:bg-[var(--color-bg-light)] transition-colors", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: form.acepta_proteccion_datos,
            onChange: (e) => updateField("acepta_proteccion_datos", e.target.checked),
            className: "mt-0.5 rounded border-[var(--color-border)]"
          }
        ),
        /* @__PURE__ */ jsxs("span", { children: [
          "He leído y acepto la",
          " ",
          /* @__PURE__ */ jsx("a", { href: "/politica-privacidad", target: "_blank", className: "text-[var(--color-action)] hover:underline font-medium", children: "Política de Protección de Datos" }),
          " ",
          "*"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-3 text-sm text-[var(--color-navy)] cursor-pointer p-3 rounded-lg hover:bg-[var(--color-bg-light)] transition-colors", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: form.acepta_comunicaciones,
            onChange: (e) => updateField("acepta_comunicaciones", e.target.checked),
            className: "mt-0.5 rounded border-[var(--color-border)]"
          }
        ),
        /* @__PURE__ */ jsx("span", { children: "Deseo recibir noticias e información comercial de Alcora Salud Ambiental" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-[var(--color-text-muted)] leading-relaxed px-3", children: [
        "Los datos facilitados serán tratados por Alcora Salud Ambiental S.L. para gestionar su solicitud de registro como cliente profesional. Puede ejercer sus derechos de acceso, rectificación o supresión dirigiéndose a",
        " ",
        /* @__PURE__ */ jsx("a", { href: "mailto:central@alcora.es", className: "text-[var(--color-action)]", children: "central@alcora.es" }),
        "."
      ] })
    ] }),
    isClient && /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("div", { className: "h-[65px]" }), children: /* @__PURE__ */ jsx(
      Turnstile,
      {
        sitekey: getTurnstileSiteKey(),
        onVerify: (token) => setTurnstileToken(token),
        onExpire: () => setTurnstileToken("")
      }
    ) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        disabled: loading,
        className: "w-full bg-[var(--color-action)] text-white py-3.5 rounded-lg text-base font-semibold hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm",
        children: loading ? /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5 animate-spin", viewBox: "0 0 24 24", fill: "none", children: [
            /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
            /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
          ] }),
          "Enviando solicitud..."
        ] }) : "Solicitar acceso profesional"
      }
    ),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-[var(--color-text-muted)]", children: [
      "¿Ya tiene cuenta?",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/login", className: "text-[var(--color-action)] hover:underline font-medium", children: "Acceder" })
    ] })
  ] });
}

const $$Registro = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Registro Profesional - Tienda Alcora" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="bg-bg-light min-h-[80vh]"> <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">  <div class="text-center mb-8"> <a href="/"> <img src="/logo-alcora.svg" alt="Alcora" class="h-10 mx-auto mb-4"> </a> <h1 class="text-2xl lg:text-3xl font-bold text-navy">
Solicitar acceso profesional
</h1> <p class="text-text-muted mt-2 max-w-xl mx-auto">
Complete el formulario con los datos de su empresa. Un administrador
          validará su solicitud y activará su cuenta en las próximas horas hábiles.
</p> </div>  <div class="flex flex-wrap justify-center gap-6 mb-8 text-sm text-text-muted"> <div class="flex items-center gap-2"> <svg class="w-5 h-5 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path> </svg>
Datos seguros y protegidos
</div> <div class="flex items-center gap-2"> <svg class="w-5 h-5 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg>
Activación en 24-48h
</div> <div class="flex items-center gap-2"> <svg class="w-5 h-5 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path> </svg>
Precios exclusivos
</div> </div>  <div class="bg-white border border-border rounded-xl p-6 sm:p-8 lg:p-10 shadow-sm"> ${renderComponent($$result2, "RegisterForm", RegisterForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/auth/RegisterForm", "client:component-export": "default" })} </div> </div> </section> ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/registro.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/registro.astro";
const $$url = "/registro";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Registro,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
