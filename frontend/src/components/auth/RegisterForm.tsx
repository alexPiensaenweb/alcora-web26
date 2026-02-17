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

    // Validaciones
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
      <div className="text-center p-8 bg-green-50 border border-green-200 rounded-lg">
        <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Solicitud enviada</h3>
        <p className="text-sm text-green-700">
          Hemos recibido su solicitud de registro. Nuestro equipo revisara su informacion
          y activara su cuenta en las proximas horas habiles. Recibira un email cuando su
          cuenta este activa.
        </p>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]";
  const labelClass = "block text-sm font-medium text-[var(--color-navy)] mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-[var(--color-bg-accent)] p-4 rounded-lg text-sm text-[var(--color-navy)]">
        <strong>Registro B2B:</strong> Complete el formulario con los datos de su empresa.
        Un administrador validara su informacion y activara su cuenta.
      </div>

      {/* ─── Datos personales ─── */}
      <div>
        <h3 className="text-base font-semibold text-[var(--color-navy)] mb-3 pb-2 border-b border-[var(--color-border)]">
          Datos personales
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre *</label>
            <input type="text" required value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Apellidos *</label>
            <input type="text" required value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* ─── Datos de empresa ─── */}
      <div>
        <h3 className="text-base font-semibold text-[var(--color-navy)] mb-3 pb-2 border-b border-[var(--color-border)]">
          Datos de empresa
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Razon Social / Empresa *</label>
            <input type="text" required value={form.razon_social} onChange={(e) => updateField("razon_social", e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>CIF / NIF *</label>
              <input type="text" required value={form.cif_nif} onChange={(e) => updateField("cif_nif", e.target.value)} className={inputClass} placeholder="B12345678" />
            </div>
            <div>
              <label className={labelClass}>Telefono *</label>
              <input type="tel" required value={form.telefono} onChange={(e) => updateField("telefono", e.target.value)} className={inputClass} />
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
              <input type="text" value={form.cargo} onChange={(e) => updateField("cargo", e.target.value)} className={inputClass} placeholder="Ej: Responsable de compras" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Direccion ─── */}
      <div>
        <h3 className="text-base font-semibold text-[var(--color-navy)] mb-3 pb-2 border-b border-[var(--color-border)]">
          Direccion
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Direccion (calle, numero, piso) *</label>
            <input type="text" required value={form.direccion_facturacion} onChange={(e) => updateField("direccion_facturacion", e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Codigo postal *</label>
              <input type="text" required value={form.codigo_postal} onChange={(e) => updateField("codigo_postal", e.target.value)} className={inputClass} placeholder="50000" maxLength={5} />
            </div>
            <div>
              <label className={labelClass}>Ciudad *</label>
              <input type="text" required value={form.ciudad} onChange={(e) => updateField("ciudad", e.target.value)} className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>Provincia *</label>
              <select required value={form.provincia} onChange={(e) => updateField("provincia", e.target.value)} className={inputClass}>
                <option value="">Seleccione...</option>
                {PROVINCIAS.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Credenciales ─── */}
      <div>
        <h3 className="text-base font-semibold text-[var(--color-navy)] mb-3 pb-2 border-b border-[var(--color-border)]">
          Credenciales de acceso
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Email *</label>
            <input type="email" required value={form.email} onChange={(e) => updateField("email", e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contrasena *</label>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => updateField("password", e.target.value)} className={inputClass} placeholder="Minimo 8 caracteres" />
            </div>
            <div>
              <label className={labelClass}>Confirmar contrasena *</label>
              <input type="password" required minLength={8} value={form.password_confirm} onChange={(e) => updateField("password_confirm", e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Legal ─── */}
      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-2 text-sm text-[var(--color-navy)] cursor-pointer">
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

        <label className="flex items-start gap-2 text-sm text-[var(--color-navy)] cursor-pointer">
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

        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mt-2">
          Los datos personales facilitados a traves de este formulario seran tratados por
          Alcora Salud Ambiental S.L. con la finalidad de gestionar su solicitud de registro
          como cliente B2B. Puede ejercer sus derechos de acceso, rectificacion o supresion
          dirigiendose a{" "}
          <a href="mailto:central@alcora.es" className="text-[var(--color-action)]">
            central@alcora.es
          </a>.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--color-action)] text-white py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Enviando solicitud..." : "Solicitar acceso B2B"}
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
