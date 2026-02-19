import { useState } from "react";

interface ProfileFormProps {
  user: {
    first_name: string;
    last_name: string;
    email: string;
    razon_social: string;
    cif_nif: string;
    telefono: string;
    direccion_facturacion: string;
    direccion_envio: string;
  };
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [form, setForm] = useState(user);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
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
          direccion_envio: form.direccion_envio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar el perfil");
      }

      setMessage("Perfil actualizado correctamente");
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal data */}
      <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
        <h3 className="text-base font-semibold text-[var(--color-navy)] mb-4">
          Datos personales
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => update("first_name", e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
              Apellidos
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
              Telefono
            </label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => update("telefono", e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-light)] text-[var(--color-text-muted)]"
            />
          </div>
        </div>
      </div>

      {/* Company data */}
      <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
        <h3 className="text-base font-semibold text-[var(--color-navy)] mb-4">
          Datos de empresa
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
              Razon social
            </label>
            <input
              type="text"
              value={form.razon_social}
              disabled
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-light)] text-[var(--color-text-muted)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
              CIF/NIF
            </label>
            <input
              type="text"
              value={form.cif_nif}
              disabled
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-light)] text-[var(--color-text-muted)]"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Para modificar la razon social o CIF/NIF contacte con el administrador.
        </p>
      </div>

      {/* Addresses */}
      <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
        <h3 className="text-base font-semibold text-[var(--color-navy)] mb-4">
          Direcciones
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
              Direccion de facturacion
            </label>
            <textarea
              value={form.direccion_facturacion}
              onChange={(e) => update("direccion_facturacion", e.target.value)}
              rows={3}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
              placeholder="Calle, numero, piso, codigo postal, ciudad, provincia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
              Direccion de envio
            </label>
            <textarea
              value={form.direccion_envio}
              onChange={(e) => update("direccion_envio", e.target.value)}
              rows={3}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
              placeholder="Calle, numero, piso, codigo postal, ciudad, provincia"
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--color-action)] text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
