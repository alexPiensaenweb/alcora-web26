import { useState } from "react";

interface Props {
  categorias: { id: number; nombre: string; parent: number | null }[];
  marcas: { id: number; nombre: string }[];
}

export default function NuevoProductoForm({ categorias, marcas }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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
    status: "draft",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.sku.trim() || !form.nombre.trim() || !form.precio_base.trim()) {
      setError("SKU, nombre y precio base son obligatorios");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        sku: form.sku.trim(),
        nombre: form.nombre.trim(),
        precio_base: parseFloat(form.precio_base),
        stock: parseInt(form.stock) || -1,
        status: form.status,
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
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al crear producto");
      }

      // Redirigir a la lista de productos
      window.location.href = "/gestion/productos";
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Nuevo producto</h1>
          <p className="text-text-muted text-sm mt-1">Crea un nuevo producto en el catálogo</p>
        </div>
        <a
          href="/gestion/productos"
          className="text-text-muted hover:text-navy text-sm"
        >
          ← Volver a productos
        </a>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mb-5">
          <span className="material-icons text-base">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos principales */}
        <div className="bg-white border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-navy text-sm uppercase tracking-wide">Datos principales</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="Ej: PROD-001"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                Precio base (sin IVA) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_base}
                  onChange={(e) => set("precio_base", e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-action"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">€</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Nombre del producto"
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Extracto</label>
            <input
              type="text"
              value={form.extracto}
              onChange={(e) => set("extracto", e.target.value)}
              placeholder="Descripción corta para listados (max 200 caracteres)"
              maxLength={200}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              placeholder="Descripción completa del producto..."
              rows={4}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action resize-none"
            />
          </div>
        </div>

        {/* Detalles */}
        <div className="bg-white border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-navy text-sm uppercase tracking-wide">Detalles</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
              />
              <p className="text-xs text-text-muted mt-1">-1 = ilimitado</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Formato</label>
              <input
                type="text"
                value={form.formato}
                onChange={(e) => set("formato", e.target.value)}
                placeholder="Ej: Bote 1L"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Unidad venta</label>
              <input
                type="text"
                value={form.unidad_venta}
                onChange={(e) => set("unidad_venta", e.target.value)}
                placeholder="Ej: Caja 6 uds"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Categoría</label>
              <select
                value={form.categoria}
                onChange={(e) => set("categoria", e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action bg-white"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent ? "— " : ""}{c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Marca</label>
              <select
                value={form.marca_id}
                onChange={(e) => set("marca_id", e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action bg-white"
              >
                <option value="">Sin marca</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Estado</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action bg-white"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover disabled:opacity-50 transition-colors"
          >
            {saving ? "Creando..." : "Crear producto"}
          </button>
          <a
            href="/gestion/productos"
            className="px-6 py-2.5 border border-border text-navy rounded-lg text-sm font-medium hover:border-action hover:text-action transition-colors"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
