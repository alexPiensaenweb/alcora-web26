import { useState, useEffect, lazy, Suspense } from "react";

const Turnstile = lazy(() => import("react-turnstile"));

function getTurnstileSiteKey(): string {
  if (typeof window !== "undefined" && (window as any).__TURNSTILE_SITE_KEY) {
    return (window as any).__TURNSTILE_SITE_KEY;
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
  { value: "otro", label: "Otro" },
];

const PROVINCIAS = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila",
  "Badajoz", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria",
  "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Gerona", "Granada",
  "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares",
  "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León", "Lérida",
  "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Orense", "Palencia",
  "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia",
  "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia",
  "Valladolid", "Vizcaya", "Zamora", "Zaragoza", "Ceuta", "Melilla",
];

type FieldErrors = Partial<Record<string, string>>;

function validateField(name: string, value: string, form?: any): string {
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
      return /^[A-Za-z]\d{7,8}[A-Za-z0-9]?$|^\d{8}[A-Za-z]$/.test(value.trim())
        ? "" : "Formato no válido (ej: B12345678 o 12345678A)";
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

export default function RegisterForm() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

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
    acepta_comunicaciones: false,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  function updateField(field: string, value: string | boolean) {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    if (touched[field] && typeof value === "string") {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value, newForm),
      }));
    }
    // Re-validate confirm password when password changes
    if (field === "password" && touched["password_confirm"]) {
      setFieldErrors((prev) => ({
        ...prev,
        password_confirm: validateField("password_confirm", newForm.password_confirm, newForm),
      }));
    }
  }

  function handleBlur(field: string, value: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value, form),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    // Validate all required fields
    const requiredFields = [
      "first_name", "last_name", "email", "password", "password_confirm",
      "razon_social", "cif_nif", "telefono", "tipo_negocio",
      "direccion_facturacion", "codigo_postal", "ciudad", "provincia",
    ];
    const newErrors: FieldErrors = {};
    let hasErrors = false;
    for (const field of requiredFields) {
      const err = validateField(field, (form as any)[field], form);
      if (err) { newErrors[field] = err; hasErrors = true; }
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
        body: JSON.stringify({ ...form, turnstileToken }),
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
    return (
      <div className="text-center p-8 sm:p-12 bg-green-50 border border-green-200 rounded-xl">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-3">Solicitud enviada correctamente</h3>
        <p className="text-sm text-green-700 max-w-md mx-auto leading-relaxed">
          Hemos recibido su solicitud de registro. Nuestro equipo revisará su información
          y activará su cuenta en las próximas horas hábiles. Recibirá un email cuando su
          cuenta esté activa.
        </p>
        <a href="/" className="inline-block mt-6 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
          Volver al inicio
        </a>
      </div>
    );
  }

  const inputBase = "w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-[var(--color-text-muted)]/60";
  const inputOk = `${inputBase} border-[var(--color-border)] focus:border-[var(--color-action)] focus:ring-[var(--color-action)]/20`;
  const inputErr = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50`;
  const inputValid = `${inputBase} border-green-400 focus:border-green-500 focus:ring-green-200`;
  const labelClass = "block text-sm font-medium text-[var(--color-navy)] mb-1.5";

  function fieldClass(name: string, value: string) {
    if (!touched[name]) return inputOk;
    if (fieldErrors[name]) return inputErr;
    if (value) return inputValid;
    return inputOk;
  }

  function FieldError({ name }: { name: string }) {
    if (!touched[name] || !fieldErrors[name]) return null;
    return (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {fieldErrors[name]}
      </p>
    );
  }

  function FieldOk({ name, value }: { name: string; value: string }) {
    if (!touched[name] || fieldErrors[name] || !value) return null;
    return (
      <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Correcto
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-xl mx-auto">
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {submitError}
        </div>
      )}

      {/* 1. Datos personales */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
          <h3 className="text-base font-semibold text-[var(--color-navy)]">Datos personales</h3>
        </div>
        <div className="space-y-4 pl-11">
          <div>
            <label className={labelClass}>Nombre *</label>
            <input
              type="text" value={form.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
              onBlur={(e) => handleBlur("first_name", e.target.value)}
              className={fieldClass("first_name", form.first_name)}
              placeholder="Juan"
            />
            <FieldError name="first_name" />
            <FieldOk name="first_name" value={form.first_name} />
          </div>
          <div>
            <label className={labelClass}>Apellidos *</label>
            <input
              type="text" value={form.last_name}
              onChange={(e) => updateField("last_name", e.target.value)}
              onBlur={(e) => handleBlur("last_name", e.target.value)}
              className={fieldClass("last_name", form.last_name)}
              placeholder="Garcia Lopez"
            />
            <FieldError name="last_name" />
            <FieldOk name="last_name" value={form.last_name} />
          </div>
          <div>
            <label className={labelClass}>Email corporativo *</label>
            <input
              type="email" value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              onBlur={(e) => handleBlur("email", e.target.value)}
              className={fieldClass("email", form.email)}
              placeholder="empresa@ejemplo.com"
            />
            <FieldError name="email" />
            <FieldOk name="email" value={form.email} />
          </div>
        </div>
      </section>

      {/* 2. Datos de empresa */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
          <h3 className="text-base font-semibold text-[var(--color-navy)]">Datos de empresa</h3>
        </div>
        <div className="space-y-4 pl-11">
          <div>
            <label className={labelClass}>Razón Social / Empresa *</label>
            <input
              type="text" value={form.razon_social}
              onChange={(e) => updateField("razon_social", e.target.value)}
              onBlur={(e) => handleBlur("razon_social", e.target.value)}
              className={fieldClass("razon_social", form.razon_social)}
              placeholder="Empresa S.L."
            />
            <FieldError name="razon_social" />
            <FieldOk name="razon_social" value={form.razon_social} />
          </div>
          <div>
            <label className={labelClass}>CIF / NIF *</label>
            <input
              type="text" value={form.cif_nif}
              onChange={(e) => updateField("cif_nif", e.target.value)}
              onBlur={(e) => handleBlur("cif_nif", e.target.value)}
              className={fieldClass("cif_nif", form.cif_nif)}
              placeholder="B12345678"
            />
            <FieldError name="cif_nif" />
            <FieldOk name="cif_nif" value={form.cif_nif} />
          </div>
          <div>
            <label className={labelClass}>Teléfono *</label>
            <input
              type="tel" value={form.telefono}
              onChange={(e) => updateField("telefono", e.target.value)}
              onBlur={(e) => handleBlur("telefono", e.target.value)}
              className={fieldClass("telefono", form.telefono)}
              placeholder="976 123 456"
            />
            <FieldError name="telefono" />
            <FieldOk name="telefono" value={form.telefono} />
          </div>
          <div>
            <label className={labelClass}>Tipo de negocio *</label>
            <select
              value={form.tipo_negocio}
              onChange={(e) => updateField("tipo_negocio", e.target.value)}
              onBlur={(e) => handleBlur("tipo_negocio", e.target.value)}
              className={fieldClass("tipo_negocio", form.tipo_negocio)}
            >
              {TIPO_NEGOCIO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <FieldError name="tipo_negocio" />
          </div>
          <div>
            <label className={labelClass}>Cargo <span className="text-[var(--color-text-muted)] font-normal">(opcional)</span></label>
            <input
              type="text" value={form.cargo}
              onChange={(e) => updateField("cargo", e.target.value)}
              className={inputOk}
              placeholder="Responsable de compras"
            />
          </div>
        </div>
      </section>

      {/* 3. Dirección */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
          <h3 className="text-base font-semibold text-[var(--color-navy)]">Dirección</h3>
        </div>
        <div className="space-y-4 pl-11">
          <div>
            <label className={labelClass}>Calle, número, piso *</label>
            <input
              type="text" value={form.direccion_facturacion}
              onChange={(e) => updateField("direccion_facturacion", e.target.value)}
              onBlur={(e) => handleBlur("direccion_facturacion", e.target.value)}
              className={fieldClass("direccion_facturacion", form.direccion_facturacion)}
              placeholder="Calle Mayor 15, 2o B"
            />
            <FieldError name="direccion_facturacion" />
            <FieldOk name="direccion_facturacion" value={form.direccion_facturacion} />
          </div>
          <div>
            <label className={labelClass}>Código postal *</label>
            <input
              type="text" value={form.codigo_postal}
              onChange={(e) => updateField("codigo_postal", e.target.value)}
              onBlur={(e) => handleBlur("codigo_postal", e.target.value)}
              className={fieldClass("codigo_postal", form.codigo_postal)}
              placeholder="50000" maxLength={5}
            />
            <FieldError name="codigo_postal" />
            <FieldOk name="codigo_postal" value={form.codigo_postal} />
          </div>
          <div>
            <label className={labelClass}>Ciudad *</label>
            <input
              type="text" value={form.ciudad}
              onChange={(e) => updateField("ciudad", e.target.value)}
              onBlur={(e) => handleBlur("ciudad", e.target.value)}
              className={fieldClass("ciudad", form.ciudad)}
              placeholder="Zaragoza"
            />
            <FieldError name="ciudad" />
            <FieldOk name="ciudad" value={form.ciudad} />
          </div>
          <div>
            <label className={labelClass}>Provincia *</label>
            <select
              value={form.provincia}
              onChange={(e) => updateField("provincia", e.target.value)}
              onBlur={(e) => handleBlur("provincia", e.target.value)}
              className={fieldClass("provincia", form.provincia)}
            >
              <option value="">Seleccione provincia...</option>
              {PROVINCIAS.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
            <FieldError name="provincia" />
          </div>
        </div>
      </section>

      {/* 4. Contraseña */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
          <h3 className="text-base font-semibold text-[var(--color-navy)]">Contraseña de acceso</h3>
        </div>
        <div className="space-y-4 pl-11">
          <div>
            <label className={labelClass}>Contraseña *</label>
            <input
              type="password" value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              onBlur={(e) => handleBlur("password", e.target.value)}
              className={fieldClass("password", form.password)}
              placeholder="Crea tu contraseña"
            />
            {/* Requisitos visuales - se muestran en cuanto hay algo escrito */}
            {form.password.length > 0 && (
              <div className="mt-2 p-3 bg-[var(--color-bg-light)] rounded-lg grid grid-cols-2 gap-1.5">
                {[
                  { ok: form.password.length >= 8, label: "Mínimo 8 caracteres" },
                  { ok: /[A-Z]/.test(form.password), label: "Una mayúscula" },
                  { ok: /[a-z]/.test(form.password), label: "Una minúscula" },
                  { ok: /[0-9]/.test(form.password), label: "Un número" },
                ].map(({ ok, label }) => (
                  <span key={label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-[var(--color-text-muted)]"}`}>
                    {ok ? (
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" strokeWidth="2" />
                      </svg>
                    )}
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Confirmar contraseña *</label>
            <input
              type="password" value={form.password_confirm}
              onChange={(e) => updateField("password_confirm", e.target.value)}
              onBlur={(e) => handleBlur("password_confirm", e.target.value)}
              className={fieldClass("password_confirm", form.password_confirm)}
              placeholder="Repite la contraseña"
            />
            <FieldError name="password_confirm" />
            {form.password_confirm.length > 0 && !fieldErrors["password_confirm"] && form.password === form.password_confirm && (
              <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Las contraseñas coinciden
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Legal + Submit */}
      <div className="border-t border-[var(--color-border)] pt-6 space-y-4">
        <label className="flex items-start gap-3 text-sm text-[var(--color-navy)] cursor-pointer p-3 rounded-lg hover:bg-[var(--color-bg-light)] transition-colors">
          <input
            type="checkbox"
            checked={form.acepta_proteccion_datos}
            onChange={(e) => updateField("acepta_proteccion_datos", e.target.checked)}
            className="mt-0.5 rounded border-[var(--color-border)]"
          />
          <span>
            He leído y acepto la{" "}
            <a href="/politica-privacidad" target="_blank" className="text-[var(--color-action)] hover:underline font-medium">
              Política de Protección de Datos
            </a>{" "}*
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm text-[var(--color-navy)] cursor-pointer p-3 rounded-lg hover:bg-[var(--color-bg-light)] transition-colors">
          <input
            type="checkbox"
            checked={form.acepta_comunicaciones}
            onChange={(e) => updateField("acepta_comunicaciones", e.target.checked)}
            className="mt-0.5 rounded border-[var(--color-border)]"
          />
          <span>Deseo recibir noticias e información comercial de Alcora Salud Ambiental</span>
        </label>

        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed px-3">
          Los datos facilitados serán tratados por Alcora Salud Ambiental S.L. para gestionar
          su solicitud de registro como cliente profesional. Puede ejercer sus derechos de acceso,
          rectificación o supresión dirigiéndose a{" "}
          <a href="mailto:central@alcora.es" className="text-[var(--color-action)]">central@alcora.es</a>.
        </p>
      </div>

      {isClient && (
        <Suspense fallback={<div className="h-[65px]" />}>
          <Turnstile
            sitekey={getTurnstileSiteKey()}
            onVerify={(token: string) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken("")}
          />
        </Suspense>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--color-action)] text-white py-3.5 rounded-lg text-base font-semibold hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando solicitud...
          </span>
        ) : "Solicitar acceso profesional"}
      </button>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        ¿Ya tiene cuenta?{" "}
        <a href="/login" className="text-[var(--color-action)] hover:underline font-medium">Acceder</a>
      </p>
    </form>
  );
}
