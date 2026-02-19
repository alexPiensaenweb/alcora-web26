import { useState, useRef } from "react";

interface Props {
  categorias: { id: number; nombre: string; parent: number | null }[];
  marcas: { id: number; nombre: string }[];
}

type FileField = "imagen" | "ficha_tecnica" | "ficha_seguridad";

export default function NuevoProductoForm({ categorias, marcas }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // File uploads
  const [files, setFiles] = useState<Record<FileField, { file: File; preview: string | null } | null>>({
    imagen: null,
    ficha_tecnica: null,
    ficha_seguridad: null,
  });
  const imgInputRef = useRef<HTMLInputElement>(null);
  const ftInputRef = useRef<HTMLInputElement>(null);
  const fsInputRef = useRef<HTMLInputElement>(null);

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

  function handleFileSelect(field: FileField, accept: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        setError("El archivo no puede superar 10MB");
        return;
      }
      setError("");

      let preview: string | null = null;
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFiles((prev) => ({ ...prev, [field]: { file, preview: reader.result as string } }));
        };
        reader.readAsDataURL(file);
        return;
      }

      setFiles((prev) => ({ ...prev, [field]: { file, preview: null } }));
    };
  }

  function removeFile(field: FileField) {
    setFiles((prev) => ({ ...prev, [field]: null }));
    const ref = field === "imagen" ? imgInputRef : field === "ficha_tecnica" ? ftInputRef : fsInputRef;
    if (ref.current) ref.current.value = "";
  }

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/gestion-api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir archivo");
    return data.data?.id;
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
      // 1. Upload files
      const uploads: Record<string, string> = {};
      if (files.imagen) {
        uploads.imagen_principal = await uploadFile(files.imagen.file);
      }
      if (files.ficha_tecnica) {
        uploads.ficha_tecnica = await uploadFile(files.ficha_tecnica.file);
      }
      if (files.ficha_seguridad) {
        uploads.ficha_seguridad = await uploadFile(files.ficha_seguridad.file);
      }

      // 2. Create product
      const payload: any = {
        sku: form.sku.trim(),
        nombre: form.nombre.trim(),
        precio_base: parseFloat(form.precio_base),
        stock: parseInt(form.stock) || -1,
        status: form.status,
        ...uploads,
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
      if (!res.ok) throw new Error(data.error || "Error al crear producto");

      window.location.href = "/gestion/productos";
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Nuevo producto</h1>
          <p className="text-text-muted text-sm mt-1">Crea un nuevo producto en el catálogo</p>
        </div>
        <a
          href="/gestion/productos"
          onClick={(e) => { e.preventDefault(); window.location.href = "/gestion/productos"; }}
          className="inline-flex items-center gap-1 text-text-muted hover:text-action text-sm transition-colors"
        >
          <span className="material-icons text-base">arrow_back</span>
          Volver a productos
        </a>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mb-5">
          <span className="material-icons text-base">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT: Form fields */}
          <div className="lg:col-span-2 space-y-5">
            {/* Main data */}
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

            {/* Details */}
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
                {saving ? "Creando producto..." : "Crear producto"}
              </button>
              <a
                href="/gestion/productos"
                onClick={(e) => { e.preventDefault(); window.location.href = "/gestion/productos"; }}
                className="px-6 py-2.5 border border-border text-navy rounded-lg text-sm font-medium hover:border-action hover:text-action transition-colors"
              >
                Cancelar
              </a>
            </div>
          </div>

          {/* RIGHT: Image + Files */}
          <div className="space-y-5">
            {/* Imagen principal - large square */}
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="font-semibold text-navy text-sm uppercase tracking-wide mb-3">Imagen principal</h3>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect("imagen", "image/*")} />
              {files.imagen?.preview ? (
                <div className="relative aspect-square rounded-lg overflow-hidden border border-border bg-bg-light">
                  <img src={files.imagen.preview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile("imagen")}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                  >
                    <span className="material-icons text-sm">close</span>
                  </button>
                </div>
              ) : (
                <div
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-action bg-bg-light flex items-center justify-center cursor-pointer transition-colors"
                  onClick={() => imgInputRef.current?.click()}
                >
                  <div className="text-center">
                    <span className="material-icons text-4xl text-text-muted">add_photo_alternate</span>
                    <p className="text-sm text-text-muted mt-2">Haz clic para añadir</p>
                    <p className="text-xs text-text-muted mt-1">JPG, PNG, WebP · Max 10MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Fichas - two small cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Ficha técnica */}
              <div className="bg-white border border-border rounded-xl p-4">
                <h3 className="font-semibold text-navy text-xs uppercase tracking-wide mb-2">Ficha técnica</h3>
                <input ref={ftInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileSelect("ficha_tecnica", ".pdf")} />
                {files.ficha_tecnica ? (
                  <div className="relative aspect-square rounded-lg border border-border bg-bg-light flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-icons text-2xl text-action">description</span>
                      <p className="text-xs text-navy mt-1 truncate max-w-full px-1">{files.ficha_tecnica.file.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile("ficha_tecnica")}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <span className="material-icons text-xs">close</span>
                    </button>
                  </div>
                ) : (
                  <div
                    className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-action bg-bg-light flex items-center justify-center cursor-pointer transition-colors"
                    onClick={() => ftInputRef.current?.click()}
                  >
                    <div className="text-center">
                      <span className="material-icons text-2xl text-text-muted">upload_file</span>
                      <p className="text-xs text-text-muted mt-1">PDF</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Ficha de seguridad */}
              <div className="bg-white border border-border rounded-xl p-4">
                <h3 className="font-semibold text-navy text-xs uppercase tracking-wide mb-2">Ficha seguridad</h3>
                <input ref={fsInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileSelect("ficha_seguridad", ".pdf")} />
                {files.ficha_seguridad ? (
                  <div className="relative aspect-square rounded-lg border border-border bg-bg-light flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-icons text-2xl text-action">verified_user</span>
                      <p className="text-xs text-navy mt-1 truncate max-w-full px-1">{files.ficha_seguridad.file.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile("ficha_seguridad")}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <span className="material-icons text-xs">close</span>
                    </button>
                  </div>
                ) : (
                  <div
                    className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-action bg-bg-light flex items-center justify-center cursor-pointer transition-colors"
                    onClick={() => fsInputRef.current?.click()}
                  >
                    <div className="text-center">
                      <span className="material-icons text-2xl text-text-muted">upload_file</span>
                      <p className="text-xs text-text-muted mt-1">PDF</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
