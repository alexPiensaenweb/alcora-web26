import { useState } from "react";

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

const ESTADOS = [
  { value: "solicitado", label: "Solicitado", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "presupuesto_solicitado", label: "Presupuesto solicitado", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "aprobado_pendiente_pago", label: "Aprobado - Pte. pago", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "pagado", label: "Pagado", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "enviado", label: "Enviado", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function PedidoAdminPanel({ pedido: initialPedido }: { pedido: Pedido }) {
  const [pedido, setPedido] = useState(initialPedido);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");
  const [notasAdmin, setNotasAdmin] = useState(initialPedido.notas_admin || "");

  const estadoActual = ESTADOS.find((e) => e.value === pedido.estado);

  const clienteNombre = pedido.user_created
    ? pedido.user_created.razon_social ||
      `${pedido.user_created.first_name || ""} ${pedido.user_created.last_name || ""}`.trim() ||
      pedido.user_created.email
    : "—";

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
      setPedido((prev) => ({ ...prev, estado: nuevoEstado }));
      setSavedMsg("Estado actualizado correctamente");
      setTimeout(() => setSavedMsg(""), 3000);
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
      setPedido((prev) => ({ ...prev, notas_admin: notasAdmin }));
      setSavedMsg("Notas guardadas");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Pedido #{pedido.id}</h1>
          <p className="text-text-muted text-sm mt-1">{formatDate(pedido.date_created)}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-5">

          {/* Items */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-navy">Productos del pedido</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-light text-xs text-text-muted uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-semibold">Producto</th>
                    <th className="text-left px-4 py-3 font-semibold">SKU</th>
                    <th className="text-center px-4 py-3 font-semibold">Uds.</th>
                    <th className="text-right px-4 py-3 font-semibold">Precio ud.</th>
                    <th className="text-right px-4 py-3 font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pedido.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-navy">{item.nombre_producto}</td>
                      <td className="px-4 py-3 text-text-muted">{item.sku}</td>
                      <td className="px-4 py-3 text-center">{item.cantidad}</td>
                      <td className="px-4 py-3 text-right">{Number(item.precio_unitario || 0).toFixed(2)} €</td>
                      <td className="px-4 py-3 text-right font-semibold">{Number(item.subtotal || 0).toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border bg-bg-light space-y-1 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span>{Number(pedido.subtotal || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Envío</span>
                <span>{Number(pedido.costo_envio || 0) === 0 ? "Gratis" : `${Number(pedido.costo_envio || 0).toFixed(2)} €`}</span>
              </div>
              <div className="flex justify-between font-bold text-navy text-base pt-1 border-t border-border">
                <span>Total (sin IVA)</span>
                <span>{Number(pedido.total || 0).toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Dirección de envío</h3>
              <p className="text-sm text-navy">{pedido.direccion_envio || "—"}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Dirección de facturación</h3>
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
              placeholder="Notas internas del pedido (solo visibles para administradores)..."
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
              {ESTADOS.map((e) => (
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

          {/* Pago */}
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Información de pago</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Método:</span>
                <span className="font-medium text-navy capitalize">
                  {pedido.metodo_pago === "transferencia" ? "Transferencia" :
                   pedido.metodo_pago === "tarjeta" ? "Tarjeta" : "—"}
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
