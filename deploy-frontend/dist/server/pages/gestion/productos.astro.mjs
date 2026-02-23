/* empty css                                          */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_VyRwZjg8.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_g9L0Gq9n.mjs';
import { directusAdmin } from '../../chunks/directus_tOieuaro.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useRef } from 'react';
export { renderers } from '../../renderers.mjs';

const STATUS_LABELS = {
  published: "Publicado",
  draft: "Borrador",
  archived: "Archivado"
};
const STATUS_COLORS = {
  published: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-700",
  archived: "bg-red-100 text-red-800"
};
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
  { key: "marca_nombre", label: "Marca", required: false }
];
function ProductosAdminPanel({
  productosInitial,
  categoriasInitial,
  marcasInitial,
  searchInitial,
  statusFilterInitial,
  total,
  page,
  totalPages,
  openImport
}) {
  const [productos, setProductos] = useState(productosInitial);
  const [search, setSearch] = useState(searchInitial);
  const [statusFilter] = useState(statusFilterInitial);
  const [view, setView] = useState(openImport ? "import" : "list");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [excelRows, setExcelRows] = useState([]);
  const [excelCols, setExcelCols] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [importStep, setImportStep] = useState("drop");
  const [importResults, setImportResults] = useState({ ok: 0, err: 0, errors: [] });
  const [importing, setImporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);
  function showMsg(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4e3);
  }
  function goToSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    window.location.href = `/gestion/productos?${params.toString()}`;
  }
  function openEdit(p) {
    setSelectedProduct(p);
    setEditData({
      sku: p.sku,
      nombre: p.nombre,
      precio_base: p.precio_base,
      stock: p.stock,
      formato: p.formato,
      unidad_venta: p.unidad_venta,
      status: p.status
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
        body: JSON.stringify(editData)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al guardar");
      }
      setProductos(
        (prev) => prev.map((p) => p.id === selectedProduct.id ? { ...p, ...editData } : p)
      );
      setSelectedProduct((prev) => prev ? { ...prev, ...editData } : null);
      setEditMode(false);
      showMsg("ok", "Producto actualizado");
    } catch (err) {
      showMsg("err", err.message || "Error desconocido");
    } finally {
      setSavingId(null);
    }
  }
  async function toggleStatus(p) {
    const nuevo = p.status === "published" ? "draft" : "published";
    setSavingId(p.id);
    try {
      const res = await fetch(`/gestion-api/productos/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nuevo })
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
  async function deleteProduct(p) {
    setDeleting(true);
    try {
      const res = await fetch(`/gestion-api/productos/${p.id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al eliminar");
      }
      setProductos((prev) => prev.filter((x) => x.id !== p.id));
      setSelectedProduct(null);
      setDeleteConfirm(null);
      showMsg("ok", `Producto "${p.nombre}" eliminado`);
    } catch (err) {
      showMsg("err", err.message || "Error al eliminar producto");
    } finally {
      setDeleting(false);
    }
  }
  const [parseError, setParseError] = useState(null);
  async function parseExcelFile(file) {
    setParseError(null);
    try {
      const XLSX = await import('xlsx');
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (data.length < 2) {
        setParseError("El archivo está vacío o solo tiene cabecera.");
        return;
      }
      const rawHeaders = data[0] || [];
      const headers = [];
      for (let i = 0; i < rawHeaders.length; i++) {
        headers.push(rawHeaders[i] != null ? String(rawHeaders[i]).trim() : `Columna_${i + 1}`);
      }
      const rows = data.slice(1).filter((r) => r.some(Boolean)).map((row) => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] != null ? String(row[i]) : "";
        });
        return obj;
      });
      setExcelCols(headers.filter((h) => !h.startsWith("Columna_")));
      setExcelRows(rows);
      const autoMap = {};
      EXCEL_COLUMNS.forEach(({ key }) => {
        const match = headers.find((h) => {
          if (!h || h.startsWith("Columna_")) return false;
          const hNorm = h.toLowerCase().replace(/[^a-z0-9]/g, "");
          const kNorm = key.replace(/_/g, "");
          return hNorm.includes(kNorm) || kNorm.includes(hNorm);
        });
        autoMap[key] = { excelCol: match || null };
      });
      setFieldMapping(autoMap);
      setImportStep("map");
    } catch (err) {
      console.error("Error parsing Excel:", err);
      setParseError(`Error al leer el archivo: ${err.message || "formato no válido"}`);
    }
  }
  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
      parseExcelFile(file);
    }
  }
  function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (file) parseExcelFile(file);
    if (e.target) e.target.value = "";
  }
  function getMappedValue(row, fieldKey) {
    const col = fieldMapping[fieldKey]?.excelCol;
    if (!col) return "";
    return row[col] || "";
  }
  function buildPreviewRows() {
    return excelRows.slice(0, 5).map((row) => {
      const obj = {};
      EXCEL_COLUMNS.forEach(({ key }) => {
        obj[key] = getMappedValue(row, key);
      });
      return obj;
    });
  }
  async function runImport() {
    setImporting(true);
    let ok = 0, err = 0;
    const errors = [];
    for (const row of excelRows) {
      const payload = {};
      EXCEL_COLUMNS.forEach(({ key }) => {
        const val = getMappedValue(row, key);
        if (val) payload[key] = val;
      });
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
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Error");
        }
        ok++;
      } catch (e) {
        err++;
        errors.push(`${payload.sku}: ${e.message}`);
      }
    }
    setImportResults({ ok, err, errors });
    setImportStep("done");
    setImporting(false);
    if (ok > 0) showMsg("ok", `${ok} productos importados`);
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-navy", children: "Productos" }),
        /* @__PURE__ */ jsxs("p", { className: "text-text-muted text-sm mt-0.5", children: [
          total,
          " resultado",
          total !== 1 ? "s" : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              setView("import");
              setImportStep("drop");
            },
            className: `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${view === "import" ? "bg-action text-white border-action" : "bg-white text-navy border-border hover:border-action"}`,
            children: [
              /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "upload_file" }),
              "Importar Excel"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/gestion/productos/nuevo",
            onClick: (e) => {
              e.preventDefault();
              window.location.href = "/gestion/productos/nuevo";
            },
            className: "flex items-center gap-2 px-4 py-2 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover transition-colors",
            children: [
              /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "add" }),
              "Nuevo producto"
            ]
          }
        )
      ] })
    ] }),
    msg && /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${msg.type === "ok" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`, children: [
      /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: msg.type === "ok" ? "check_circle" : "error" }),
      msg.text
    ] }),
    view === "import" ? (
      // ─── EXCEL IMPORT UI ───
      /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-border", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-navy", children: "Importar productos desde Excel" }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setView("list");
            setImportStep("drop");
          }, className: "text-text-muted hover:text-navy text-sm", children: "← Volver a lista" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-6", children: [
            ["drop", "map", "preview", "done"].map((s, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${importStep === s ? "bg-action text-white" : ["drop", "map", "preview", "done"].indexOf(importStep) > i ? "bg-green-500 text-white" : "bg-bg-light text-text-muted"}`, children: ["drop", "map", "preview", "done"].indexOf(importStep) > i ? "✓" : i + 1 }),
              i < 3 && /* @__PURE__ */ jsx("div", { className: "w-8 h-0.5 bg-border" })
            ] }, s)),
            /* @__PURE__ */ jsxs("div", { className: "ml-2 text-xs text-text-muted", children: [
              importStep === "drop" && "Subir archivo",
              importStep === "map" && "Mapear columnas",
              importStep === "preview" && "Previsualizar",
              importStep === "done" && "Resultado"
            ] })
          ] }),
          importStep === "drop" && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                accept: ".xlsx,.xls,.csv",
                className: "hidden",
                onChange: handleFileInput
              }
            ),
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: `border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${dragOver ? "border-action bg-bg-accent" : "border-border hover:border-action hover:bg-bg-light"}`,
                onDragOver: (e) => {
                  e.preventDefault();
                  setDragOver(true);
                },
                onDragLeave: () => setDragOver(false),
                onDrop: handleDrop,
                onClick: () => fileInputRef.current?.click(),
                children: [
                  /* @__PURE__ */ jsx("span", { className: "material-icons text-5xl text-text-muted mb-3 block", children: "cloud_upload" }),
                  /* @__PURE__ */ jsx("p", { className: "text-navy font-semibold mb-1", children: "Arrastra tu archivo Excel aquí" }),
                  /* @__PURE__ */ jsx("p", { className: "text-text-muted text-sm", children: "o haz clic para seleccionar" }),
                  /* @__PURE__ */ jsx("p", { className: "text-text-muted text-xs mt-3", children: "Formatos: .xlsx, .xls, .csv" })
                ]
              }
            ),
            parseError && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "error" }),
              parseError
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 p-4 bg-bg-light rounded-lg", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-navy mb-2", children: "Columnas esperadas en tu Excel:" }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: EXCEL_COLUMNS.map((c) => /* @__PURE__ */ jsxs("span", { className: `text-xs px-2 py-1 rounded-full ${c.required ? "bg-action/10 text-action font-medium" : "bg-border text-text-muted"}`, children: [
                c.label,
                c.required ? " *" : ""
              ] }, c.key)) }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted mt-2", children: "* Campos obligatorios. La primera fila debe ser la cabecera." })
            ] })
          ] }),
          importStep === "map" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-text-muted", children: [
                excelRows.length,
                " filas detectadas. Asigna las columnas de tu archivo a los campos del sistema:"
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: () => setImportStep("drop"), className: "text-xs text-text-muted hover:text-navy", children: "← Cambiar archivo" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: EXCEL_COLUMNS.map(({ key, label, required }) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-48 flex-shrink-0", children: /* @__PURE__ */ jsxs("span", { className: `text-sm font-medium ${required ? "text-navy" : "text-text-muted"}`, children: [
                label,
                required ? " *" : ""
              ] }) }),
              /* @__PURE__ */ jsx("span", { className: "text-text-muted text-lg", children: "→" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: fieldMapping[key]?.excelCol || "",
                  onChange: (e) => setFieldMapping((prev) => ({ ...prev, [key]: { excelCol: e.target.value || null } })),
                  className: "flex-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "— No importar —" }),
                    excelCols.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
                  ]
                }
              ),
              fieldMapping[key]?.excelCol && /* @__PURE__ */ jsx("span", { className: "material-icons text-green-500 text-lg", children: "check_circle" })
            ] }, key)) }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setImportStep("preview"),
                  disabled: !fieldMapping.sku?.excelCol || !fieldMapping.nombre?.excelCol || !fieldMapping.precio_base?.excelCol,
                  className: "px-5 py-2.5 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover disabled:opacity-50 transition-colors",
                  children: "Previsualizar →"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted self-center", children: "SKU, Nombre y Precio son obligatorios" })
            ] })
          ] }),
          importStep === "preview" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-text-muted", children: [
                "Mostrando primeras 5 filas de ",
                excelRows.length,
                ". Comprueba que los datos son correctos:"
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: () => setImportStep("map"), className: "text-xs text-text-muted hover:text-navy", children: "← Editar mapeo" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto border border-border rounded-lg", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-bg-light border-b border-border", children: EXCEL_COLUMNS.filter((c) => fieldMapping[c.key]?.excelCol).map((c) => /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 font-semibold text-text-muted uppercase tracking-wide", children: c.label }, c.key)) }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: buildPreviewRows().map((row, i) => /* @__PURE__ */ jsx("tr", { className: i % 2 === 0 ? "bg-white" : "bg-bg-light", children: EXCEL_COLUMNS.filter((c) => fieldMapping[c.key]?.excelCol).map((c) => /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-navy", children: row[c.key] || /* @__PURE__ */ jsx("span", { className: "text-text-muted", children: "—" }) }, c.key)) }, i)) })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "flex gap-3", children: /* @__PURE__ */ jsx(
              "button",
              {
                onClick: runImport,
                disabled: importing,
                className: "flex items-center gap-2 px-5 py-2.5 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover disabled:opacity-50 transition-colors",
                children: importing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { className: "material-icons text-base animate-spin", children: "autorenew" }),
                  "Importando..."
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { className: "material-icons text-base", children: "upload" }),
                  "Importar ",
                  excelRows.length,
                  " productos"
                ] })
              }
            ) })
          ] }),
          importStep === "done" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-green-50 border border-green-200 rounded-xl p-5 text-center", children: [
                /* @__PURE__ */ jsx("p", { className: "text-4xl font-bold text-green-700", children: importResults.ok }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-green-700 mt-1", children: "Importados correctamente" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: `border rounded-xl p-5 text-center ${importResults.err > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-border"}`, children: [
                /* @__PURE__ */ jsx("p", { className: `text-4xl font-bold ${importResults.err > 0 ? "text-red-700" : "text-gray-400"}`, children: importResults.err }),
                /* @__PURE__ */ jsx("p", { className: `text-sm mt-1 ${importResults.err > 0 ? "text-red-700" : "text-text-muted"}`, children: "Con errores" })
              ] })
            ] }),
            importResults.errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-red-800 mb-2", children: "Errores:" }),
              /* @__PURE__ */ jsx("ul", { className: "text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto", children: importResults.errors.map((e, i) => /* @__PURE__ */ jsxs("li", { children: [
                "• ",
                e
              ] }, i)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    setImportStep("drop");
                    setExcelRows([]);
                    setExcelCols([]);
                  },
                  className: "px-4 py-2 border border-border text-navy rounded-lg text-sm hover:bg-bg-light transition-colors",
                  children: "Importar otro archivo"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    setView("list");
                    window.location.reload();
                  },
                  className: "px-4 py-2 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover transition-colors",
                  children: "Ver productos →"
                }
              )
            ] })
          ] })
        ] })
      ] })
    ) : (
      // ─── LIST VIEW ───
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-4", children: [
          /* @__PURE__ */ jsxs("form", { onSubmit: goToSearch, className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: "Buscar por SKU, nombre...",
                className: "flex-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
              }
            ),
            /* @__PURE__ */ jsx("button", { type: "submit", className: "px-4 py-2 bg-action text-white text-sm rounded-lg hover:bg-action-hover transition-colors", children: "Buscar" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: ["", "published", "draft", "archived"].map((s) => /* @__PURE__ */ jsx(
            "a",
            {
              href: s ? `/gestion/productos?status=${s}` : "/gestion/productos",
              onClick: (e) => {
                e.preventDefault();
                window.location.href = s ? `/gestion/productos?status=${s}` : "/gestion/productos";
              },
              className: `px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${statusFilter === s ? "bg-action text-white border-action" : "bg-white text-navy border-border hover:border-action"}`,
              children: s === "" ? "Todos" : STATUS_LABELS[s]
            },
            s
          )) }),
          /* @__PURE__ */ jsx("div", { className: "bg-white border border-border rounded-xl overflow-hidden", children: productos.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-bg-light border-b border-border text-xs text-text-muted uppercase tracking-wide", children: [
                /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-semibold", children: "Producto" }),
                /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-semibold hidden sm:table-cell", children: "SKU" }),
                /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-semibold hidden md:table-cell", children: "Categoría" }),
                /* @__PURE__ */ jsx("th", { className: "text-right px-4 py-3 font-semibold", children: "Precio" }),
                /* @__PURE__ */ jsx("th", { className: "text-center px-4 py-3 font-semibold hidden sm:table-cell", children: "Stock" }),
                /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-semibold hidden sm:table-cell", children: "Estado" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: productos.map((p) => /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: `hover:bg-bg-light transition-colors cursor-pointer ${selectedProduct?.id === p.id ? "bg-bg-accent" : ""}`,
                  onClick: () => {
                    setSelectedProduct(p);
                    setEditMode(false);
                  },
                  children: [
                    /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
                      /* @__PURE__ */ jsx("div", { className: "font-medium text-navy", children: p.nombre }),
                      p.formato && /* @__PURE__ */ jsx("div", { className: "text-xs text-text-muted", children: p.formato })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-3 hidden sm:table-cell font-mono text-xs text-text-muted", children: p.sku }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-3 hidden md:table-cell text-text-muted text-xs", children: typeof p.categoria === "object" ? p.categoria?.nombre : "—" }),
                    /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right font-semibold text-navy", children: [
                      Number(p.precio_base || 0).toFixed(2),
                      " €"
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center hidden sm:table-cell", children: /* @__PURE__ */ jsx("span", { className: `text-sm font-medium ${p.stock <= 0 ? "text-red-600" : p.stock <= 5 ? "text-yellow-600" : "text-green-700"}`, children: p.stock }) }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-3 hidden sm:table-cell", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-700"}`, children: STATUS_LABELS[p.status] || p.status }) }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          openEdit(p);
                        },
                        className: "text-action hover:underline text-xs font-medium",
                        children: "Editar"
                      }
                    ) })
                  ]
                },
                p.id
              )) })
            ] }) }),
            totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-t border-border bg-bg-light", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-text-muted", children: [
                "Página ",
                page,
                " de ",
                totalPages
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                page > 1 && /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: `/gestion/productos?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`,
                    onClick: (e) => {
                      e.preventDefault();
                      window.location.href = `/gestion/productos?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`;
                    },
                    className: "px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-white transition-colors",
                    children: "← Anterior"
                  }
                ),
                page < totalPages && /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: `/gestion/productos?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`,
                    onClick: (e) => {
                      e.preventDefault();
                      window.location.href = `/gestion/productos?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`;
                    },
                    className: "px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-white transition-colors",
                    children: "Siguiente →"
                  }
                )
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "py-16 text-center text-text-muted", children: [
            /* @__PURE__ */ jsx("span", { className: "material-icons text-4xl opacity-30 mb-3 block", children: "inventory_2" }),
            /* @__PURE__ */ jsx("p", { children: "No hay productos" })
          ] }) })
        ] }),
        selectedProduct && /* @__PURE__ */ jsx("div", { className: "lg:w-80 flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "bg-white border border-border rounded-xl p-5 sticky top-4 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-navy", children: editMode ? "Editar producto" : "Detalle" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setSelectedProduct(null), className: "text-text-muted hover:text-navy", children: /* @__PURE__ */ jsx("span", { className: "material-icons text-lg", children: "close" }) })
          ] }),
          editMode ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            [
              { key: "sku", label: "SKU" },
              { key: "nombre", label: "Nombre" }
            ].map(({ key, label }) => /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs text-text-muted block mb-1", children: label }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: editData[key] || "",
                  onChange: (e) => setEditData((prev) => ({ ...prev, [key]: e.target.value })),
                  className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                }
              )
            ] }, key)),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs text-text-muted block mb-1", children: "Precio base (€)" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    step: "0.01",
                    value: editData.precio_base || "",
                    onChange: (e) => setEditData((prev) => ({ ...prev, precio_base: parseFloat(e.target.value) || 0 })),
                    className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs text-text-muted block mb-1", children: "Stock" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: editData.stock || "",
                    onChange: (e) => setEditData((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 })),
                    className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs text-text-muted block mb-1", children: "Formato" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: editData.formato || "",
                  onChange: (e) => setEditData((prev) => ({ ...prev, formato: e.target.value })),
                  className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs text-text-muted block mb-1", children: "Estado" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: editData.status || "draft",
                  onChange: (e) => setEditData((prev) => ({ ...prev, status: e.target.value })),
                  className: "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "published", children: "Publicado" }),
                    /* @__PURE__ */ jsx("option", { value: "draft", children: "Borrador" }),
                    /* @__PURE__ */ jsx("option", { value: "archived", children: "Archivado" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: saveProduct,
                  disabled: savingId === selectedProduct.id,
                  className: "flex-1 px-3 py-2 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover disabled:opacity-50 transition-colors",
                  children: savingId === selectedProduct.id ? "Guardando..." : "Guardar"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setEditMode(false),
                  className: "px-3 py-2 border border-border text-navy rounded-lg text-sm hover:bg-bg-light transition-colors",
                  children: "Cancelar"
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-navy text-base", children: selectedProduct.nombre }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted font-mono", children: selectedProduct.sku })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-bg-light rounded-lg p-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted", children: "Precio" }),
                /* @__PURE__ */ jsxs("p", { className: "font-bold text-navy", children: [
                  Number(selectedProduct.precio_base || 0).toFixed(2),
                  " €"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-bg-light rounded-lg p-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-text-muted", children: "Stock" }),
                /* @__PURE__ */ jsx("p", { className: `font-bold ${selectedProduct.stock <= 0 ? "text-red-600" : selectedProduct.stock <= 5 ? "text-yellow-600" : "text-green-700"}`, children: selectedProduct.stock })
              ] })
            ] }),
            selectedProduct.formato && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-text-muted", children: "Formato:" }),
              " ",
              selectedProduct.formato
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => openEdit(selectedProduct),
                  className: "flex-1 px-3 py-2 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover transition-colors",
                  children: "Editar"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => toggleStatus(selectedProduct),
                  disabled: savingId === selectedProduct.id,
                  className: "px-3 py-2 border border-border text-navy rounded-lg text-sm hover:bg-bg-light disabled:opacity-50 transition-colors",
                  children: selectedProduct.status === "published" ? "Despublicar" : "Publicar"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-3 border-t border-border", children: deleteConfirm === selectedProduct.id ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-red-700 font-medium", children: "Se eliminara permanentemente este producto. Esta accion no se puede deshacer." }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => deleteProduct(selectedProduct),
                    disabled: deleting,
                    className: "flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors",
                    children: deleting ? "Eliminando..." : "Confirmar eliminacion"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setDeleteConfirm(null),
                    className: "px-3 py-2 border border-border text-navy rounded-lg text-xs hover:bg-bg-light transition-colors",
                    children: "Cancelar"
                  }
                )
              ] })
            ] }) : /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setDeleteConfirm(selectedProduct.id),
                className: "w-full flex items-center justify-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "material-icons text-sm", children: "delete_outline" }),
                  "Eliminar producto"
                ]
              }
            ) })
          ] })
        ] }) })
      ] })
    )
  ] });
}

const $$Astro = createAstro("https://tienda.alcora.es");
const $$Productos = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Productos;
  const url = new URL(Astro2.request.url);
  const search = url.searchParams.get("search") || "";
  const statusFilter = url.searchParams.get("status") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const importar = url.searchParams.get("importar") === "1";
  const limit = 25;
  const offset = (page - 1) * limit;
  let productos = [];
  let categorias = [];
  let marcas = [];
  let total = 0;
  try {
    const filters = [];
    if (statusFilter) filters.push(`filter[status][_eq]=${statusFilter}`);
    if (search) filters.push(`search=${encodeURIComponent(search)}`);
    const qs = [
      `sort=nombre`,
      `limit=${limit}`,
      `offset=${offset}`,
      `fields=id,status,sku,nombre,slug,precio_base,stock,imagen_principal,categoria.id,categoria.nombre,marca_id.nombre,formato,unidad_venta`,
      `meta=filter_count`,
      ...filters
    ].join("&");
    const [prodRes, catRes, marcaRes] = await Promise.all([
      directusAdmin(`/items/productos?${qs}`),
      directusAdmin("/items/categorias?sort=nombre&fields=id,nombre,parent&limit=200"),
      directusAdmin("/items/marcas?sort=nombre&fields=id,nombre&limit=100")
    ]);
    productos = prodRes.data || [];
    total = prodRes.meta?.filter_count || 0;
    categorias = catRes.data || [];
    marcas = marcaRes.data || [];
  } catch (err) {
    console.error("[admin/productos] Error:", err);
  }
  const totalPages = Math.ceil(total / limit);
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Productos - Admin Alcora", "activeTab": "productos" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "ProductosAdminPanel", ProductosAdminPanel, { "client:load": true, "productosInitial": productos, "categoriasInitial": categorias, "marcasInitial": marcas, "searchInitial": search, "statusFilterInitial": statusFilter, "total": total, "page": page, "totalPages": totalPages, "openImport": importar, "client:component-hydration": "load", "client:component-path": "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/components/admin/ProductosAdminPanel", "client:component-export": "default" })} ` })}`;
}, "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/gestion/productos.astro", void 0);

const $$file = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend/src/pages/gestion/productos.astro";
const $$url = "/gestion/productos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Productos,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
