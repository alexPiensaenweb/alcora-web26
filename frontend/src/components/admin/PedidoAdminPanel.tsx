import { useState, useRef, useEffect, useCallback } from "react";

interface PedidoItem {
  id: number;
  nombre_producto: string;
  sku: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto?: { nombre: string; sku: string; imagen_principal: string | null } | null;
}

interface Pedido {
  id: number;
  tipo: "pedido" | "presupuesto";
  estado: string;
  date_created: string;
  total: number;
  subtotal: number;
  costo_envio: number;
  metodo_pago: string | null;
  referencia_pago: string | null;
  notas_cliente: string | null;
  notas_admin: string | null;
  direccion_envio: string | null;
  direccion_facturacion: string | null;
  items: PedidoItem[];
  user_created: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    razon_social: string | null;
    cif_nif: string | null;
    telefono: string | null;
    grupo_cliente: string | null;
  } | null;
}

interface SearchResult {
  id: string;
  sku: string;
  nombre: string;
  precio_base: number;
  imagen_principal: string | null;
  formato: string | null;
}

const ESTADOS_PEDIDO = [
  { value: "solicitado", label: "Solicitado", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "aprobado_pendiente_pago", label: "Aprobado - Pte. pago", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "pagado", label: "Pagado", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "enviado", label: "Enviado", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200" },
];

const ESTADOS_PRESUPUESTO = [
  { value: "presupuesto_solicitado", label: "Presupuesto solicitado", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Product Search Component ──
function ProductSearch({ onSelect, disabled }: { onSelect: (p: SearchResult) => void; disabled: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/gestion-api/productos/buscar?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setResults(json.data || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(val: string) {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 300);
  }

  function select(p: SearchResult) {
    onSelect(p);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const directusUrl = typeof document !== "undefined"
    ? document.body.dataset.directusUrl || ""
    : "";

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <span className="material-icons text-base text-text-muted absolute left-3 top-1/2 -translate-y-1/2">search</span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Buscar por SKU o nombre de producto..."
          disabled={disabled}
          className="w-full text-sm border border-border rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-action disabled:opacity-50"
        />
        {loading && (
          <span className="material-icons text-base text-action animate-spin absolute right-3 top-1/2 -translate-y-1/2">sync</span>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => select(p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-light text-left transition-colors border-b border-border last:border-b-0"
            >
              {p.imagen_principal ? (
                <img
                  src={`${directusUrl}/assets/${p.imagen_principal}?width=40&height=40&fit=cover`}
                  alt=""
                  className="w-10 h-10 rounded object-cover flex-shrink-0 bg-bg-light"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-bg-light flex items-center justify-center flex-shrink-0">
                  <span className="material-icons text-base text-text-muted">image</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy truncate">{p.nombre}</p>
                <p className="text-xs text-text-muted">
                  SKU: {p.sku || "—"} · {Number(p.precio_base || 0).toFixed(2)} €
                  {p.formato ? ` · ${p.formato}` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg p-4 text-center text-sm text-text-muted">
          No se encontraron productos
        </div>
      )}
    </div>
  );
}

// ── Main Panel ──
export default function PedidoAdminPanel({ pedido: initialPedido }: { pedido: Pedido }) {
  const [pedido, setPedido] = useState(initialPedido);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");
  const [notasAdmin, setNotasAdmin] = useState(initialPedido.notas_admin || "");
  // Editable items state (presupuesto only)
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editCantidad, setEditCantidad] = useState(0);
  const [editPrecio, setEditPrecio] = useState(0);
  const [converting, setConverting] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProductCantidad, setNewProductCantidad] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null);
  // Discount state
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(5);

  const isPresupuesto = pedido.tipo === "presupuesto";
  const estados = isPresupuesto ? ESTADOS_PRESUPUESTO : ESTADOS_PEDIDO;
  const allEstados = [...ESTADOS_PRESUPUESTO, ...ESTADOS_PEDIDO];
  const estadoActual = allEstados.find((e) => e.value === pedido.estado);
  const tipoLabel = isPresupuesto ? "Presupuesto" : "Pedido";
  const canEdit = isPresupuesto && pedido.estado !== "cancelado";

  const clienteNombre = pedido.user_created
    ? pedido.user_created.razon_social ||
      `${pedido.user_created.first_name || ""} ${pedido.user_created.last_name || ""}`.trim() ||
      pedido.user_created.email
    : "—";

  function showMessage(msg: string, reload = false) {
    setSavedMsg(msg);
    if (reload) {
      setTimeout(() => window.location.reload(), 600);
    } else {
      setTimeout(() => setSavedMsg(""), 3000);
    }
  }

  async function cambiarEstado(nuevoEstado: string) {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const res = await fetch(`/gestion-api/pedidos/${pedido.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al cambiar estado");
      }
      showMessage("Estado actualizado correctamente", true);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  async function guardarNotas() {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const res = await fetch(`/gestion-api/pedidos/${pedido.id}/notas`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notas_admin: notasAdmin }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al guardar notas");
      }
      showMessage("Notas guardadas", true);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  // ── Item editing ──

  function startEdit(item: PedidoItem) {
    setEditingItemId(item.id);
    setEditCantidad(item.cantidad);
    setEditPrecio(item.precio_unitario);
  }

  function cancelEdit() {
    setEditingItemId(null);
  }

  async function saveItemEdit(itemId: number) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/gestion-api/pedidos/${pedido.id}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          itemId,
          data: { cantidad: editCantidad, precio_unitario: editPrecio },
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al actualizar item");
      }
      showMessage("Item actualizado", true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(itemId: number) {
    if (!confirm("¿Eliminar este producto del presupuesto?")) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/gestion-api/pedidos/${pedido.id}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", itemId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al eliminar item");
      }
      showMessage("Producto eliminado del presupuesto", true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addItem() {
    if (!selectedProduct) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/gestion-api/pedidos/${pedido.id}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          data: { producto: selectedProduct.id, cantidad: newProductCantidad },
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al añadir producto");
      }
      showMessage("Producto añadido", true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Bulk discount ──

  async function applyBulkDiscount() {
    if (!confirm(`¿Aplicar ${discountPercent}% de descuento a TODOS los productos del presupuesto? Esta accion modifica los precios unitarios.`)) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/gestion-api/pedidos/${pedido.id}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_discount", percent: discountPercent }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al aplicar descuento");
      }
      showMessage(`Descuento del ${discountPercent}% aplicado`, true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Convert ──

  async function convertirAPedido() {
    if (!confirm("¿Convertir este presupuesto en pedido? Se calculara el envio y el estado cambiara a 'Aprobado - Pendiente de pago'.")) return;
    setConverting(true);
    setError("");
    try {
      const res = await fetch(`/gestion-api/pedidos/${pedido.id}/convertir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al convertir");
      }
      showMessage("Presupuesto convertido a pedido correctamente", true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <a
        href="/gestion/pedidos"
        onClick={(e) => { e.preventDefault(); window.location.href = "/gestion/pedidos"; }}
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-action transition-colors"
      >
        <span className="material-icons text-base">arrow_back</span>
        Volver a pedidos
      </a>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">{tipoLabel} #{pedido.id}</h1>
            <p className="text-text-muted text-sm mt-1">{formatDate(pedido.date_created)}</p>
          </div>
          {isPresupuesto && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              Presupuesto
            </span>
          )}
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${estadoActual?.color || "bg-gray-100 text-gray-700 border-gray-200"}`}>
          {estadoActual?.label || pedido.estado}
        </div>
      </div>

      {/* Feedback */}
      {savedMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          <span className="material-icons text-base">check_circle</span>
          {savedMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <span className="material-icons text-base">error</span>
          {error}
        </div>
      )}

      {/* Presupuesto actions bar */}
      {canEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-amber-900">Acciones de presupuesto</h3>
              <p className="text-sm text-amber-700 mt-1">
                Edita productos, aplica descuentos y convierte a pedido cuando estes listo.
              </p>
            </div>
            <button
              onClick={convertirAPedido}
              disabled={converting || saving}
              className="shrink-0 px-5 py-2.5 bg-action text-white rounded-lg font-medium hover:bg-action-hover disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <span className="material-icons text-base">swap_horiz</span>
              {converting ? "Convirtiendo..." : "Convertir a pedido"}
            </button>
          </div>

          {/* Discount row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-amber-200">
            <button
              onClick={() => setShowDiscount(!showDiscount)}
              className="text-sm font-medium text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              <span className="material-icons text-base">percent</span>
              Aplicar descuento general
              <span className="material-icons text-sm">{showDiscount ? "expand_less" : "expand_more"}</span>
            </button>

            {showDiscount && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-20 text-sm border border-amber-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-action text-center"
                />
                <span className="text-sm text-amber-800">%</span>
                <button
                  onClick={applyBulkDiscount}
                  disabled={saving}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  Aplicar
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-5">

          {/* Items */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-navy">
                {isPresupuesto ? "Productos del presupuesto" : "Productos del pedido"}
              </h2>
              {canEdit && (
                <button
                  onClick={() => { setAddingProduct(!addingProduct); setSelectedProduct(null); }}
                  className="text-xs px-3 py-1.5 bg-action text-white rounded-lg hover:bg-action-hover transition-colors flex items-center gap-1"
                >
                  <span className="material-icons text-sm">{addingProduct ? "close" : "add"}</span>
                  {addingProduct ? "Cerrar" : "Añadir producto"}
                </button>
              )}
            </div>

            {/* Add product form with search */}
            {addingProduct && canEdit && (
              <div className="px-5 py-4 border-b border-border bg-bg-accent space-y-3">
                <label className="text-xs font-medium text-text-muted block">Buscar producto</label>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <ProductSearch onSelect={setSelectedProduct} disabled={saving} />
                  <div className="w-24 shrink-0">
                    <label className="text-xs font-medium text-text-muted mb-1 block">Cantidad</label>
                    <input
                      type="number"
                      min={1}
                      value={newProductCantidad}
                      onChange={(e) => setNewProductCantidad(parseInt(e.target.value) || 1)}
                      className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action"
                    />
                  </div>
                  <button
                    onClick={addItem}
                    disabled={saving || !selectedProduct}
                    className="px-4 py-2 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover disabled:opacity-50 shrink-0"
                  >
                    Añadir
                  </button>
                </div>
                {selectedProduct && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-action/30">
                    <span className="material-icons text-base text-action">check_circle</span>
                    <div className="text-sm">
                      <span className="font-medium text-navy">{selectedProduct.nombre}</span>
                      <span className="text-text-muted ml-2">
                        SKU: {selectedProduct.sku || "—"} · {Number(selectedProduct.precio_base || 0).toFixed(2)} €
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="ml-auto text-text-muted hover:text-navy"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-light text-xs text-text-muted uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-semibold">Producto</th>
                    <th className="text-left px-4 py-3 font-semibold">SKU</th>
                    <th className="text-center px-4 py-3 font-semibold">Uds.</th>
                    <th className="text-right px-4 py-3 font-semibold">Precio ud.</th>
                    <th className="text-right px-4 py-3 font-semibold">Subtotal</th>
                    {canEdit && (
                      <th className="text-center px-4 py-3 font-semibold w-24">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pedido.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-navy">{item.nombre_producto}</td>
                      <td className="px-4 py-3 text-text-muted">{item.sku}</td>
                      {editingItemId === item.id ? (
                        <>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={editCantidad}
                              onChange={(e) => setEditCantidad(parseInt(e.target.value) || 1)}
                              className="w-16 text-sm text-center border border-action rounded px-1 py-1 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={editPrecio}
                              onChange={(e) => setEditPrecio(parseFloat(e.target.value) || 0)}
                              className="w-20 text-sm text-right border border-action rounded px-1 py-1 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-text-muted">
                            {(editCantidad * editPrecio).toFixed(2)} €
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => saveItemEdit(item.id)}
                                disabled={saving}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Guardar"
                              >
                                <span className="material-icons text-lg">check</span>
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-text-muted hover:text-navy"
                                title="Cancelar"
                              >
                                <span className="material-icons text-lg">close</span>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-center">{item.cantidad}</td>
                          <td className="px-4 py-3 text-right">{Number(item.precio_unitario || 0).toFixed(2)} €</td>
                          <td className="px-4 py-3 text-right font-semibold">{Number(item.subtotal || 0).toFixed(2)} €</td>
                          {canEdit && (
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => startEdit(item)}
                                  className="text-action hover:text-action-hover"
                                  title="Editar"
                                >
                                  <span className="material-icons text-lg">edit</span>
                                </button>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-400 hover:text-red-600"
                                  title="Eliminar"
                                >
                                  <span className="material-icons text-lg">delete</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                  {(!pedido.items || pedido.items.length === 0) && (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-text-muted">
                        No hay productos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border bg-bg-light space-y-1 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span>{Number(pedido.subtotal || 0).toFixed(2)} €</span>
              </div>
              {!isPresupuesto && (
                <div className="flex justify-between text-text-muted">
                  <span>Envio</span>
                  <span>{Number(pedido.costo_envio || 0) === 0 ? "Gratis" : `${Number(pedido.costo_envio || 0).toFixed(2)} €`}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-navy text-base pt-1 border-t border-border">
                <span>Total (sin IVA)</span>
                <span>{Number(pedido.total || 0).toFixed(2)} €</span>
              </div>
              {isPresupuesto && (
                <p className="text-xs text-text-muted pt-1">
                  * El coste de envio se calculara al convertir a pedido
                </p>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Direccion de envio</h3>
              <p className="text-sm text-navy">{pedido.direccion_envio || "—"}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Direccion de facturacion</h3>
              <p className="text-sm text-navy">{pedido.direccion_facturacion || "—"}</p>
            </div>
          </div>

          {/* Notas cliente */}
          {pedido.notas_cliente && (
            <div className="bg-bg-accent border border-action/20 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-action uppercase tracking-wide mb-2">Notas del cliente</h3>
              <p className="text-sm text-navy">{pedido.notas_cliente}</p>
            </div>
          )}

          {/* Notas admin */}
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Notas internas</h3>
            <textarea
              value={notasAdmin}
              onChange={(e) => setNotasAdmin(e.target.value)}
              placeholder="Notas internas (solo visibles para administradores)..."
              rows={3}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-action resize-none"
            />
            <button
              onClick={guardarNotas}
              disabled={saving}
              className="mt-2 px-4 py-2 bg-action text-white rounded-lg text-sm font-medium hover:bg-action-hover disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando..." : "Guardar notas"}
            </button>
          </div>
        </div>

        {/* Right: Actions + Client */}
        <div className="space-y-5">

          {/* Cambiar estado */}
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-navy mb-4">Cambiar estado</h3>
            <div className="space-y-2">
              {estados.map((e) => (
                <button
                  key={e.value}
                  onClick={() => cambiarEstado(e.value)}
                  disabled={saving || e.value === pedido.estado}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    e.value === pedido.estado
                      ? `${e.color} cursor-default`
                      : "bg-white border-border text-navy hover:border-action hover:text-action disabled:opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{e.label}</span>
                    {e.value === pedido.estado && (
                      <span className="material-icons text-base">check</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pago (solo para pedidos) */}
          {!isPresupuesto && (
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Informacion de pago</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Metodo:</span>
                  <span className="font-medium text-navy capitalize">
                    {pedido.metodo_pago === "transferencia" ? "Transferencia" :
                     pedido.metodo_pago === "pendiente" ? "Pendiente" : "—"}
                  </span>
                </div>
                {pedido.referencia_pago && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Referencia:</span>
                    <span className="font-mono text-xs text-navy">{pedido.referencia_pago}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cliente */}
          {pedido.user_created && (
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Cliente</h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-navy">{clienteNombre}</p>
                {pedido.user_created.cif_nif && (
                  <p className="text-text-muted">CIF/NIF: {pedido.user_created.cif_nif}</p>
                )}
                <a href={`mailto:${pedido.user_created.email}`} className="text-action hover:underline block">
                  {pedido.user_created.email}
                </a>
                {pedido.user_created.telefono && (
                  <a href={`tel:${pedido.user_created.telefono}`} className="text-text-muted hover:text-navy block">
                    {pedido.user_created.telefono}
                  </a>
                )}
                {pedido.user_created.grupo_cliente && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-bg-accent text-action text-xs rounded-full font-medium capitalize">
                    {pedido.user_created.grupo_cliente}
                  </span>
                )}
                <div className="pt-2 border-t border-border">
                  <a
                    href={`/gestion/usuarios?email=${encodeURIComponent(pedido.user_created.email)}`}
                    onClick={(e) => { e.preventDefault(); window.location.href = `/gestion/usuarios?email=${encodeURIComponent(pedido.user_created.email)}`; }}
                    className="text-xs text-action hover:underline"
                  >
                    Ver perfil de usuario →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
