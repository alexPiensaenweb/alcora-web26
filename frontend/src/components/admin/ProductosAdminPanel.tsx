import { useState, useRef } from "react";

interface Producto {
  id: string;
  status: string;
  sku: string;
  nombre: string;
  slug: string;
  precio_base: number;
  stock: number;
  imagen_principal: string | null;
  categoria?: { id: number; nombre: string } | null;
  marca_id?: { nombre: string } | null;
  formato: string | null;
  unidad_venta: string | null;
}

interface Categoria { id: number; nombre: string; parent: any }
interface Marca { id: number; nombre: string }

const STATUS_LABELS: Record<string, string> = {
  published: "Publicado",
  draft: "Borrador",
  archived: "Archivado",
};
const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-700",
  archived: "bg-red-100 text-red-800",
};

// ─── Excel column mapping config ───
const EXCEL_COLUMNS = [
  { key: "sku", label: "SKU / Referencia", required: true },
  { key: "nombre", label: "Nombre del producto", required: true },
  { key: "precio_base", label: "Precio base (€ sin IVA)", required: true },
  { key: "stock", label: "Stock", required: false },
  { key: "extracto", label: "Descripción corta", required: false },
  { key: "descripcion", label: "Descripción larga", required: false },
  { key: "formato", label: "Formato / Presentación", required: false },
  { key: "unidad_venta", label: "Unidad de venta", required: false },
  { key: "categoria_nombre", label: "Nombre de categoría", required: false },
  { key: "marca_nombre", label: "Marca", required: false },
];

interface ExcelRow { [col: string]: string }
interface MappedField { excelCol: string | null }
type FieldMapping = Record<string, MappedField>

interface Props {
  productosInitial: Producto[];
  categoriasInitial: Categoria[];
  marcasInitial: Marca[];
  searchInitial: string;
  statusFilterInitial: string;
  total: number;
  page: number;
  totalPages: number;
  openImport: boolean;
}

export default function ProductosAdminPanel({
  productosInitial,
  categoriasInitial,
  marcasInitial,
  searchInitial,
  statusFilterInitial,
  total,
  page,
  totalPages,
  openImport,
}: Props) {
  const [productos, setProductos] = useState(productosInitial);
  const [search, setSearch] = useState(searchInitial);
  const [statusFilter] = useState(statusFilterInitial);
  const [view, setView] = useState<"list" | "import">(openImport ? "import" : "list");
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Producto>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Import state
  const [dragOver, setDragOver] = useState(false);
  const [excelRows, setExcelRows] = useState<ExcelRow[]>([]);
  const [excelCols, setExcelCols] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [importStep, setImportStep] = useState<"drop" | "map" | "preview" | "done">("drop");
  const [importResults, setImportResults] = useState<{ ok: number; err: number; errors: string[] }>({ ok: 0, err: 0, errors: [] });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showMsg(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  function goToSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    window.location.href = `/gestion/productos?${params.toString()}`;
  }

  // ─── Product editing ───
  function openEdit(p: Producto) {
    setSelectedProduct(p);
    setEditData({
      sku: p.sku,
      nombre: p.nombre,
      precio_base: p.precio_base,
      stock: p.stock,
      formato: p.formato,
      unidad_venta: p.unidad_venta,
      status: p.status,
    });
    setEditMode(true);
  }

  async function saveProduct() {
    if (!selectedProduct) return;
    setSavingId(selectedProduct.id);
    try {
      const res = await fetch(`/gestion-api/productos/${selectedProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al guardar");
      }
      setProductos((prev) =>
        prev.map((p) => p.id === selectedProduct.id ? { ...p, ...editData } : p)
      );
      setSelectedProduct((prev) => prev ? { ...prev, ...editData } : null);
      setEditMode(false);
      showMsg("ok", "Producto actualizado");
    } catch (err: any) {
      showMsg("err", err.message || "Error desconocido");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleStatus(p: Producto) {
    const nuevo = p.status === "published" ? "draft" : "published";
    setSavingId(p.id);
    try {
      const res = await fetch(`/gestion-api/productos/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nuevo }),
      });
      if (!res.ok) throw new Error("Error");
      setProductos((prev) => prev.map((x) => x.id === p.id ? { ...x, status: nuevo } : x));
      if (selectedProduct?.id === p.id) setSelectedProduct((prev) => prev ? { ...prev, status: nuevo } : null);
      showMsg("ok", nuevo === "published" ? "Producto publicado" : "Producto desactivado");
    } catch {
      showMsg("err", "Error al cambiar estado");
    } finally {
      setSavingId(null);
    }
  }

  // ─── Excel import ───
  const [parseError, setParseError] = useState<string | null>(null);

  async function parseExcelFile(file: File) {
    setParseError(null);
    try {
      const XLSX = await import("xlsx");
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      if (data.length < 2) {
        setParseError("El archivo está vacío o solo tiene cabecera.");
        return;
      }

      const headers = data[0].map(String);
      const rows: ExcelRow[] = data.slice(1).filter((r) => r.some(Boolean)).map((row) => {
        const obj: ExcelRow = {};
        headers.forEach((h, i) => { obj[h] = row[i] != null ? String(row[i]) : ""; });
        return obj;
      });

      setExcelCols(headers);
      setExcelRows(rows);

      // Auto-map: intenta emparejar por nombre similar
      const autoMap: FieldMapping = {};
      EXCEL_COLUMNS.forEach(({ key }) => {
        const match = headers.find((h) =>
          h.toLowerCase().replace(/[^a-z0-9]/g, "").includes(key.replace(/_/g, "")) ||
          key.replace(/_/g, "").includes(h.toLowerCase().replace(/[^a-z0-9]/g, ""))
        );
        autoMap[key] = { excelCol: match || null };
      });
      setFieldMapping(autoMap);
      setImportStep("map");
    } catch (err: any) {
      console.error("Error parsing Excel:", err);
      setParseError(`Error al leer el archivo: ${err.message || "formato no válido"}`);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
      parseExcelFile(file);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseExcelFile(file);
    // Reset para poder seleccionar el mismo archivo otra vez
    if (e.target) e.target.value = "";
  }

  function getMappedValue(row: ExcelRow, fieldKey: string): string {
    const col = fieldMapping[fieldKey]?.excelCol;
    if (!col) return "";
    return row[col] || "";
  }

  function buildPreviewRows() {
    return excelRows.slice(0, 5).map((row) => {
      const obj: Record<string, string> = {};
      EXCEL_COLUMNS.forEach(({ key }) => { obj[key] = getMappedValue(row, key); });
      return obj;
    });
  }

  async function runImport() {
    setImporting(true);
    let ok = 0, err = 0;
    const errors: string[] = [];

    for (const row of excelRows) {
      const payload: Record<string, any> = {};
      EXCEL_COLUMNS.forEach(({ key }) => {
        const val = getMappedValue(row, key);
        if (val) payload[key] = val;
      });

      // Tipos
      if (payload.precio_base) payload.precio_base = parseFloat(payload.precio_base) || 0;
      if (payload.stock) payload.stock = parseInt(payload.stock) || 0;

      if (!payload.sku || !payload.nombre) {
        err++;
        errors.push(`Fila sin SKU o nombre`);
        continue;
      }

      try {
        const res = await fetch("/gestion-api/productos/importar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Error");
        }
        ok++;
      } catch (e: any) {
        err++;
        errors.push(`${payload.sku}: ${e.message}`);
      }
    }

    setImportResults({ ok, err, errors });
    setImportStep("done");
    setImporting(false);
    if (ok > 0) showMsg("ok", `${ok} productos importados`);
  }

  // ─── Render ───
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Productos</h1>
          <p className="text-text-muted text-sm mt-0.5">{total} resultado{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setView("import"); setImportStep("drop"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              view === "import" ? "bg-action text-white border-action" : "bg-white text-navy border-border hover:border-action"
            }`}
          >
            <span className="material-icons text-base">upload_file</span>
            Importar Excel
          </button>
          <a
            href="/gestion/productos/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover transition-colors"
          >
            <span className="material-icons text-base">add</span>
            Nuevo producto
          </a>
        </div>
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
          msg.type === "ok" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <span className="material-icons text-base">{msg.type === "ok" ? "check_circle" : "error"}</span>
          {msg.text}
        </div>
      )}

      {/* View toggle */}
      {view === "import" ? (
        // ─── EXCEL IMPORT UI ───
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-navy">Importar productos desde Excel</h2>
            <button onClick={() => { setView("list"); setImportStep("drop"); }} className="text-text-muted hover:text-navy text-sm">
              ← Volver a lista
            </button>
          </div>

          <div className="p-5">
            {/* Steps indicator */}
            <div className="flex items-center gap-2 mb-6">
              {["drop", "map", "preview", "done"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    importStep === s ? "bg-action text-white" :
                    ["drop", "map", "preview", "done"].indexOf(importStep) > i ? "bg-green-500 text-white" :
                    "bg-bg-light text-text-muted"
                  }`}>
                    {["drop", "map", "preview", "done"].indexOf(importStep) > i ? "✓" : i + 1}
                  </div>
                  {i < 3 && <div className="w-8 h-0.5 bg-border" />}
                </div>
              ))}
              <div className="ml-2 text-xs text-text-muted">
                {importStep === "drop" && "Subir archivo"}
                {importStep === "map" && "Mapear columnas"}
                {importStep === "preview" && "Previsualizar"}
                {importStep === "done" && "Resultado"}
              </div>
            </div>

            {/* Step: Drop file */}
            {importStep === "drop" && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                    dragOver ? "border-action bg-bg-accent" : "border-border hover:border-action hover:bg-bg-light"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="material-icons text-5xl text-text-muted mb-3 block">cloud_upload</span>
                  <p className="text-navy font-semibold mb-1">Arrastra tu archivo Excel aquí</p>
                  <p className="text-text-muted text-sm">o haz clic para seleccionar</p>
                  <p className="text-text-muted text-xs mt-3">Formatos: .xlsx, .xls, .csv</p>
                </div>

                {parseError && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    <span className="material-icons text-base">error</span>
                    {parseError}
                  </div>
                )}

                <div className="mt-6 p-4 bg-bg-light rounded-lg">
                  <p className="text-sm font-semibold text-navy mb-2">Columnas esperadas en tu Excel:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXCEL_COLUMNS.map((c) => (
                      <span key={c.key} className={`text-xs px-2 py-1 rounded-full ${c.required ? "bg-action/10 text-action font-medium" : "bg-border text-text-muted"}`}>
                        {c.label}{c.required ? " *" : ""}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-2">* Campos obligatorios. La primera fila debe ser la cabecera.</p>
                </div>
              </div>
            )}

            {/* Step: Map columns */}
            {importStep === "map" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">{excelRows.length} filas detectadas. Asigna las columnas de tu archivo a los campos del sistema:</p>
                  <button onClick={() => setImportStep("drop")} className="text-xs text-text-muted hover:text-navy">← Cambiar archivo</button>
                </div>

                <div className="space-y-3">
                  {EXCEL_COLUMNS.map(({ key, label, required }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-48 flex-shrink-0">
                        <span className={`text-sm font-medium ${required ? "text-navy" : "text-text-muted"}`}>
                          {label}{required ? " *" : ""}
                        </span>
                      </div>
                      <span className="text-text-muted text-lg">→</span>
                      <select
                        value={fieldMapping[key]?.excelCol || ""}
                        onChange={(e) =>
                          setFieldMapping((prev) => ({ ...prev, [key]: { excelCol: e.target.value || null } }))
                        }
                        className="flex-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                      >
                        <option value="">— No importar —</option>
                        {excelCols.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {fieldMapping[key]?.excelCol && (
                        <span className="material-icons text-green-500 text-lg">check_circle</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setImportStep("preview")}
                    disabled={!fieldMapping.sku?.excelCol || !fieldMapping.nombre?.excelCol || !fieldMapping.precio_base?.excelCol}
                    className="px-5 py-2.5 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover disabled:opacity-50 transition-colors"
                  >
                    Previsualizar →
                  </button>
                  <p className="text-xs text-text-muted self-center">SKU, Nombre y Precio son obligatorios</p>
                </div>
              </div>
            )}

            {/* Step: Preview */}
            {importStep === "preview" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">Mostrando primeras 5 filas de {excelRows.length}. Comprueba que los datos son correctos:</p>
                  <button onClick={() => setImportStep("map")} className="text-xs text-text-muted hover:text-navy">← Editar mapeo</button>
                </div>

                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-bg-light border-b border-border">
                        {EXCEL_COLUMNS.filter((c) => fieldMapping[c.key]?.excelCol).map((c) => (
                          <th key={c.key} className="text-left px-3 py-2 font-semibold text-text-muted uppercase tracking-wide">
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {buildPreviewRows().map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-bg-light"}>
                          {EXCEL_COLUMNS.filter((c) => fieldMapping[c.key]?.excelCol).map((c) => (
                            <td key={c.key} className="px-3 py-2 text-navy">
                              {row[c.key] || <span className="text-text-muted">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={runImport}
                    disabled={importing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover disabled:opacity-50 transition-colors"
                  >
                    {importing ? (
                      <>
                        <span className="material-icons text-base animate-spin">autorenew</span>
                        Importando...
                      </>
                    ) : (
                      <>
                        <span className="material-icons text-base">upload</span>
                        Importar {excelRows.length} productos
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step: Done */}
            {importStep === "done" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                    <p className="text-4xl font-bold text-green-700">{importResults.ok}</p>
                    <p className="text-sm text-green-700 mt-1">Importados correctamente</p>
                  </div>
                  <div className={`border rounded-xl p-5 text-center ${importResults.err > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-border"}`}>
                    <p className={`text-4xl font-bold ${importResults.err > 0 ? "text-red-700" : "text-gray-400"}`}>{importResults.err}</p>
                    <p className={`text-sm mt-1 ${importResults.err > 0 ? "text-red-700" : "text-text-muted"}`}>Con errores</p>
                  </div>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-red-800 mb-2">Errores:</p>
                    <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                      {importResults.errors.map((e, i) => <li key={i}>• {e}</li>)}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setImportStep("drop"); setExcelRows([]); setExcelCols([]); }}
                    className="px-4 py-2 border border-border text-navy rounded-lg text-sm hover:bg-bg-light transition-colors"
                  >
                    Importar otro archivo
                  </button>
                  <button
                    onClick={() => { setView("list"); window.location.reload(); }}
                    className="px-4 py-2 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover transition-colors"
                  >
                    Ver productos →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ─── LIST VIEW ───
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 space-y-4">
            {/* Search bar */}
            <form onSubmit={goToSearch} className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por SKU, nombre..."
                className="flex-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
              />
              <button type="submit" className="px-4 py-2 bg-action text-white text-sm rounded-lg hover:bg-action-hover transition-colors">
                Buscar
              </button>
            </form>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {["", "published", "draft", "archived"].map((s) => (
                <a
                  key={s}
                  href={s ? `/gestion/productos?status=${s}` : "/gestion/productos"}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    statusFilter === s ? "bg-action text-white border-action" : "bg-white text-navy border-border hover:border-action"
                  }`}
                >
                  {s === "" ? "Todos" : STATUS_LABELS[s]}
                </a>
              ))}
            </div>

            {/* Product table */}
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              {productos.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-bg-light border-b border-border text-xs text-text-muted uppercase tracking-wide">
                          <th className="text-left px-4 py-3 font-semibold">Producto</th>
                          <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">SKU</th>
                          <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Categoría</th>
                          <th className="text-right px-4 py-3 font-semibold">Precio</th>
                          <th className="text-center px-4 py-3 font-semibold hidden sm:table-cell">Stock</th>
                          <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Estado</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {productos.map((p) => (
                          <tr
                            key={p.id}
                            className={`hover:bg-bg-light transition-colors cursor-pointer ${selectedProduct?.id === p.id ? "bg-bg-accent" : ""}`}
                            onClick={() => { setSelectedProduct(p); setEditMode(false); }}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-navy">{p.nombre}</div>
                              {p.formato && <div className="text-xs text-text-muted">{p.formato}</div>}
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-text-muted">{p.sku}</td>
                            <td className="px-4 py-3 hidden md:table-cell text-text-muted text-xs">
                              {typeof p.categoria === "object" ? p.categoria?.nombre : "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-navy">{Number(p.precio_base || 0).toFixed(2)} €</td>
                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                              <span className={`text-sm font-medium ${p.stock <= 0 ? "text-red-600" : p.stock <= 5 ? "text-yellow-600" : "text-green-700"}`}>
                                {p.stock}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-700"}`}>
                                {STATUS_LABELS[p.status] || p.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                                className="text-action hover:underline text-xs font-medium"
                              >
                                Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-light">
                      <p className="text-xs text-text-muted">Página {page} de {totalPages}</p>
                      <div className="flex gap-2">
                        {page > 1 && (
                          <a href={`/gestion/productos?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                             className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-white transition-colors">← Anterior</a>
                        )}
                        {page < totalPages && (
                          <a href={`/gestion/productos?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                             className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-white transition-colors">Siguiente →</a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-16 text-center text-text-muted">
                  <span className="material-icons text-4xl opacity-30 mb-3 block">inventory_2</span>
                  <p>No hay productos</p>
                </div>
              )}
            </div>
          </div>

          {/* Product detail / edit panel */}
          {selectedProduct && (
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white border border-border rounded-xl p-5 sticky top-4 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-navy">{editMode ? "Editar producto" : "Detalle"}</h3>
                  <button onClick={() => setSelectedProduct(null)} className="text-text-muted hover:text-navy">
                    <span className="material-icons text-lg">close</span>
                  </button>
                </div>

                {editMode ? (
                  <div className="space-y-3">
                    {[
                      { key: "sku", label: "SKU" },
                      { key: "nombre", label: "Nombre" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs text-text-muted block mb-1">{label}</label>
                        <input
                          type="text"
                          value={(editData as any)[key] || ""}
                          onChange={(e) => setEditData((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                        />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-text-muted block mb-1">Precio base (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editData.precio_base || ""}
                          onChange={(e) => setEditData((prev) => ({ ...prev, precio_base: parseFloat(e.target.value) || 0 }))}
                          className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted block mb-1">Stock</label>
                        <input
                          type="number"
                          value={editData.stock || ""}
                          onChange={(e) => setEditData((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                          className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Formato</label>
                      <input
                        type="text"
                        value={editData.formato || ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, formato: e.target.value }))}
                        className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Estado</label>
                      <select
                        value={editData.status || "draft"}
                        onChange={(e) => setEditData((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                      >
                        <option value="published">Publicado</option>
                        <option value="draft">Borrador</option>
                        <option value="archived">Archivado</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={saveProduct}
                        disabled={savingId === selectedProduct.id}
                        className="flex-1 px-3 py-2 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover disabled:opacity-50 transition-colors"
                      >
                        {savingId === selectedProduct.id ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-3 py-2 border border-border text-navy rounded-lg text-sm hover:bg-bg-light transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold text-navy text-base">{selectedProduct.nombre}</p>
                      <p className="text-xs text-text-muted font-mono">{selectedProduct.sku}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-bg-light rounded-lg p-3">
                        <p className="text-xs text-text-muted">Precio</p>
                        <p className="font-bold text-navy">{Number(selectedProduct.precio_base || 0).toFixed(2)} €</p>
                      </div>
                      <div className="bg-bg-light rounded-lg p-3">
                        <p className="text-xs text-text-muted">Stock</p>
                        <p className={`font-bold ${selectedProduct.stock <= 0 ? "text-red-600" : selectedProduct.stock <= 5 ? "text-yellow-600" : "text-green-700"}`}>
                          {selectedProduct.stock}
                        </p>
                      </div>
                    </div>
                    {selectedProduct.formato && (
                      <div><span className="text-text-muted">Formato:</span> {selectedProduct.formato}</div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => openEdit(selectedProduct)}
                        className="flex-1 px-3 py-2 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleStatus(selectedProduct)}
                        disabled={savingId === selectedProduct.id}
                        className="px-3 py-2 border border-border text-navy rounded-lg text-sm hover:bg-bg-light disabled:opacity-50 transition-colors"
                      >
                        {selectedProduct.status === "published" ? "Despublicar" : "Publicar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
