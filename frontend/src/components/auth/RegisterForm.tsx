import { useState } from "react";

export default function RegisterForm() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    razon_social: "",
    cif_nif: "",
    telefono: "",
    direccion_facturacion: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-[var(--color-bg-accent)] p-4 rounded-lg text-sm text-[var(--color-navy)]">
        <strong>Registro B2B:</strong> Complete el formulario con los datos de su empresa.
        Un administrador validara su informacion y activara su cuenta.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Nombre *</label>
          <input
            type="text"
            required
            value={form.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Apellidos *</label>
          <input
            type="text"
            required
            value={form.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Razon Social / Empresa *</label>
        <input
          type="text"
          required
          value={form.razon_social}
          onChange={(e) => updateField("razon_social", e.target.value)}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">CIF / NIF *</label>
          <input
            type="text"
            required
            value={form.cif_nif}
            onChange={(e) => updateField("cif_nif", e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]"
            placeholder="B12345678"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Telefono *</label>
          <input
            type="tel"
            required
            value={form.telefono}
            onChange={(e) => updateField("telefono", e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Email *</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Contrasena *</label>
        <input
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)]"
          placeholder="Minimo 8 caracteres"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Direccion de facturacion *</label>
        <textarea
          required
          rows={3}
          value={form.direccion_facturacion}
          onChange={(e) => updateField("direccion_facturacion", e.target.value)}
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-action)] focus:ring-1 focus:ring-[var(--color-action)] resize-none"
          placeholder="Calle, numero, CP, ciudad, provincia"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--color-action)] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
