import { useState } from "react";

const TIPO_NEGOCIO_OPTIONS = [
  { value: "", label: "Seleccione tipo de negocio..." },
  { value: "control_plagas", label: "Control de plagas" },
  { value: "limpieza", label: "Limpieza profesional" },
  { value: "horeca", label: "Hosteleria / HORECA" },
  { value: "sanidad", label: "Sanidad / Hospital" },
  { value: "alimentaria", label: "Industria alimentaria" },
  { value: "ambiental", label: "Gestion ambiental" },
  { value: "distribucion", label: "Distribucion" },
  { value: "otro", label: "Otro" },
];

const PROVINCIAS = [
  "Alava", "Albacete", "Alicante", "Almeria", "Asturias", "Avila",
  "Badajoz", "Barcelona", "Burgos", "Caceres", "Cadiz", "Cantabria",
  "Castellon", "Ciudad Real", "Cordoba", "Cuenca", "Gerona", "Granada",
  "Guadalajara", "Guipuzcoa", "Huelva", "Huesca", "Islas Baleares",
  "Jaen", "La Coruna", "La Rioja", "Las Palmas", "Leon", "Lerida",
  "Lugo", "Madrid", "Malaga", "Murcia", "Navarra", "Orense", "Palencia",
  "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia",
  "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia",
  "Valladolid", "Vizcaya", "Zamora", "Zaragoza", "Ceuta", "Melilla",
];

export default function RegisterForm() {
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError("Complete todos los campos obligatorios");
      return;
    }

    if (form.password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }

    if (form.password !== form.password_confirm) {
      setError("Las contrasenas no coinciden");
      return;
    }

    if (!form.razon_social || !form.cif_nif) {
      setError("La razon social y CIF/NIF son obligatorios");
      return;
    }

    if (!form.tipo_negocio) {
      setError("Seleccione el tipo de negocio");
      return;
    }

    if (!form.acepta_proteccion_datos) {
      setError("Debe aceptar la politica de proteccion de datos");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          razon_social: form.razon_social,
          cif_nif: form.cif_nif,
          telefono: form.telefono,
          cargo: form.cargo,
          tipo_negocio: form.tipo_negocio,
          direccion_facturacion: form.direccion_facturacion,
          ciudad: form.ciudad,
          provincia: form.provincia,
          codigo_postal: form.codigo_postal,
          acepta_proteccion_datos: form.acepta_proteccion_datos,
          acepta_comunicaciones: form.acepta_comunicaciones,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al enviar la solicitud");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Error de conexion. Intentelo de nuevo.");
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
          Hemos recibido su solicitud de registro. Nuestro equipo revisara su informacion
          y activara su cuenta en las proximas horas habiles. Recibira un email cuando su
          cuenta este activa.
        </p>
        <a
          href="/"
          className="inline-block mt-6 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-2 focus:ring-[var(--color-action)]/20 transition-all placeholder:text-[var(--color-text-muted)]/60";
  const labelClass = "block text-sm font-medium text-[var(--color-navy)] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </div>
      )}

      {/* Two-column layout for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          {/* Datos personales */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <h3 className="text-base font-semibold text-[var(--color-navy)]">Datos personales</h3>
            </div>
            <div className="space-y-4 pl-11">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombre *</label>
                  <input type="text" required value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} className={inputClass} placeholder="Juan" />
                </div>
                <div>
                  <label className={labelClass}>Apellidos *</label>
                  <input type="text" required value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} className={inputClass} placeholder="Garcia Lopez" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email corporativo *</label>
                <input type="email" required value={form.email} onChange={(e) => updateField("email", e.target.value)} className={inputClass} placeholder="empresa@ejemplo.com" />
              </div>
            </div>
          </section>

          {/* Datos de empresa */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <h3 className="text-base font-semibold text-[var(--color-navy)]">Datos de empresa</h3>
            </div>
            <div className="space-y-4 pl-11">
              <div>
                <label className={labelClass}>Razon Social / Empresa *</label>
                <input type="text" required value={form.razon_social} onChange={(e) => updateField("razon_social", e.target.value)} className={inputClass} placeholder="Empresa S.L." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>CIF / NIF *</label>
                  <input type="text" required value={form.cif_nif} onChange={(e) => updateField("cif_nif", e.target.value)} className={inputClass} placeholder="B12345678" />
                </div>
                <div>
                  <label className={labelClass}>Telefono *</label>
                  <input type="tel" required value={form.telefono} onChange={(e) => updateField("telefono", e.target.value)} className={inputClass} placeholder="976 123 456" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo de negocio *</label>
                  <select required value={form.tipo_negocio} onChange={(e) => updateField("tipo_negocio", e.target.value)} className={inputClass}>
                    {TIPO_NEGOCIO_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Cargo</label>
                  <input type="text" value={form.cargo} onChange={(e) => updateField("cargo", e.target.value)} className={inputClass} placeholder="Responsable de compras" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          {/* Direccion */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <h3 className="text-base font-semibold text-[var(--color-navy)]">Direccion</h3>
            </div>
            <div className="space-y-4 pl-11">
              <div>
                <label className={labelClass}>Direccion (calle, numero, piso) *</label>
                <input type="text" required value={form.direccion_facturacion} onChange={(e) => updateField("direccion_facturacion", e.target.value)} className={inputClass} placeholder="Calle Mayor 15, 2o B" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>C.P. *</label>
                  <input type="text" required value={form.codigo_postal} onChange={(e) => updateField("codigo_postal", e.target.value)} className={inputClass} placeholder="50000" maxLength={5} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Ciudad *</label>
                  <input type="text" required value={form.ciudad} onChange={(e) => updateField("ciudad", e.target.value)} className={inputClass} placeholder="Zaragoza" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Provincia *</label>
                <select required value={form.provincia} onChange={(e) => updateField("provincia", e.target.value)} className={inputClass}>
                  <option value="">Seleccione provincia...</option>
                  {PROVINCIAS.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Credenciales */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-[var(--color-action)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
              <h3 className="text-base font-semibold text-[var(--color-navy)]">Contrasena de acceso</h3>
            </div>
            <div className="space-y-4 pl-11">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Contrasena *</label>
                  <input type="password" required minLength={8} value={form.password} onChange={(e) => updateField("password", e.target.value)} className={inputClass} placeholder="Min. 8 caracteres" />
                </div>
                <div>
                  <label className={labelClass}>Confirmar contrasena *</label>
                  <input type="password" required minLength={8} value={form.password_confirm} onChange={(e) => updateField("password_confirm", e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* FULL WIDTH: Legal + Submit */}
      <div className="border-t border-[var(--color-border)] pt-6 space-y-4">
        <label className="flex items-start gap-3 text-sm text-[var(--color-navy)] cursor-pointer p-3 rounded-lg hover:bg-[var(--color-bg-light)] transition-colors">
          <input
            type="checkbox"
            checked={form.acepta_proteccion_datos}
            onChange={(e) => updateField("acepta_proteccion_datos", e.target.checked)}
            className="mt-0.5 rounded border-[var(--color-border)]"
            required
          />
          <span>
            He leido y acepto la{" "}
            <a href="/politica-privacidad" target="_blank" className="text-[var(--color-action)] hover:underline font-medium">
              Politica de Proteccion de Datos
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
          <span>
            Deseo recibir noticias e informacion comercial de Alcora Salud Ambiental
          </span>
        </label>

        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed px-3">
          Los datos facilitados seran tratados por Alcora Salud Ambiental S.L. para gestionar
          su solicitud de registro como cliente profesional. Puede ejercer sus derechos de acceso,
          rectificacion o supresion dirigiendose a{" "}
          <a href="mailto:central@alcora.es" className="text-[var(--color-action)]">
            central@alcora.es
          </a>.
        </p>
      </div>

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
        Ya tiene cuenta?{" "}
        <a href="/login" className="text-[var(--color-action)] hover:underline font-medium">
          Acceder
        </a>
      </p>
    </form>
  );
}
