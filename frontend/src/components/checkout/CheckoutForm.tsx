import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  $cartList,
  $cartSubtotal,
  $shippingCost,
  $cartTotal,
  clearCart,
} from "../../stores/cart";
import { FREE_SHIPPING_THRESHOLD } from "../../lib/shipping";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

interface CheckoutFormProps {
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    razon_social: string | null;
    cif_nif: string | null;
    telefono: string | null;
    direccion_envio: string | null;
    direccion_facturacion: string | null;
  };
}

export default function CheckoutForm({ user }: CheckoutFormProps) {
  const items = useStore($cartList);
  const subtotal = useStore($cartSubtotal);
  const shipping = useStore($shippingCost);
  const total = useStore($cartTotal);

  const [direccionEnvio, setDireccionEnvio] = useState(
    user.direccion_envio || user.direccion_facturacion || ""
  );
  const [direccionFacturacion, setDireccionFacturacion] = useState(
    user.direccion_facturacion || ""
  );
  const [mismaDir, setMismaDir] = useState(
    !user.direccion_facturacion ||
      user.direccion_facturacion === user.direccion_envio ||
      !user.direccion_envio
  );
  const [notasCliente, setNotasCliente] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);

  if (items.length === 0 && !orderId) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-[var(--color-navy)] mb-2">
          Su carrito esta vacio
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Anada productos antes de continuar con el pedido.
        </p>
        <a
          href="/catalogo"
          className="inline-block bg-[var(--color-action)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors"
        >
          Ver catalogo
        </a>
      </div>
    );
  }

  // ─── Confirmacion de pedido ───
  if (orderId) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-navy)] text-center mb-2">
          Pedido registrado
        </h2>
        <p className="text-center text-[var(--color-text-muted)] mb-6">
          Pedido <strong>#{orderId}</strong> recibido correctamente.
        </p>

        <div className="bg-[var(--color-bg-accent)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
          <p className="text-sm text-[var(--color-navy)] leading-relaxed">
            Nos pondremos en contacto con usted para confirmar el pedido y coordinar
            el metodo de pago y los detalles de envio. Recibira una notificacion por email.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <a href="/cuenta/pedidos" className="bg-[var(--color-action)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors">
            Ver mis pedidos
          </a>
          <a href="/catalogo" className="border border-[var(--color-border)] text-[var(--color-navy)] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-bg-light)] transition-colors">
            Seguir comprando
          </a>
        </div>
      </div>
    );
  }

  // ─── Submit handler ───
  async function handleSubmit() {
    if (!direccionEnvio.trim()) {
      setError("Debe indicar una direccion de envio");
      return;
    }
    if (!mismaDir && !direccionFacturacion.trim()) {
      setError("Debe indicar una direccion de facturacion");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/cart/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
          })),
          direccion_envio: direccionEnvio,
          direccion_facturacion: mismaDir ? direccionEnvio : direccionFacturacion,
          metodo_pago: "pendiente",
          notas_cliente: notasCliente || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar el pedido");

      clearCart();
      setOrderId(data.pedido.id);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // ─── Render principal ───
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Form */}
      <div className="flex-1 space-y-6">
        {/* Customer info summary */}
        <div className="bg-[var(--color-bg-accent)] border border-[var(--color-border)] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--color-navy)]">Datos de facturacion</h3>
            <a href="/cuenta" className="text-xs text-[var(--color-action)] hover:underline">Editar perfil</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div>
              <span className="text-[var(--color-text-muted)]">Nombre: </span>
              <span className="text-[var(--color-navy)] font-medium">
                {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Empresa: </span>
              <span className="text-[var(--color-navy)] font-medium">{user.razon_social || "—"}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">CIF/NIF: </span>
              <span className="text-[var(--color-navy)] font-medium">{user.cif_nif || "—"}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Email: </span>
              <span className="text-[var(--color-navy)] font-medium">{user.email}</span>
            </div>
            {user.telefono && (
              <div>
                <span className="text-[var(--color-text-muted)]">Telefono: </span>
                <span className="text-[var(--color-navy)] font-medium">{user.telefono}</span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-navy)] mb-4">
            Direccion de envio
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
                Direccion de envio *
              </label>
              <textarea
                value={direccionEnvio}
                onChange={(e) => setDireccionEnvio(e.target.value)}
                rows={3}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
                placeholder="Calle, numero, piso, codigo postal, ciudad, provincia"
              />
              {!direccionEnvio && user.direccion_facturacion && (
                <button
                  type="button"
                  onClick={() => setDireccionEnvio(user.direccion_facturacion || "")}
                  className="mt-1 text-xs text-[var(--color-action)] hover:underline"
                >
                  Usar direccion de facturacion
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--color-navy)]">
              <input
                type="checkbox"
                checked={mismaDir}
                onChange={(e) => setMismaDir(e.target.checked)}
                className="rounded border-[var(--color-border)]"
              />
              La direccion de facturacion es la misma
            </label>

            {!mismaDir && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
                  Direccion de facturacion *
                </label>
                <textarea
                  value={direccionFacturacion}
                  onChange={(e) => setDireccionFacturacion(e.target.value)}
                  rows={3}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
                  placeholder="Calle, numero, piso, codigo postal, ciudad, provincia"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
                Notas del pedido (opcional)
              </label>
              <textarea
                value={notasCliente}
                onChange={(e) => setNotasCliente(e.target.value)}
                rows={2}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
                placeholder="Instrucciones especiales de entrega, referencia, etc."
              />
            </div>
          </div>
        </div>

        {/* Items summary */}
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-navy)] mb-4">Productos ({items.length})</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productoId} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-navy)] truncate">{item.nombre}</p>
                  <p className="text-[var(--color-text-muted)]">{item.cantidad} x {formatCurrency(item.precioUnitario)}</p>
                </div>
                <span className="font-semibold text-[var(--color-navy)] ml-4">{formatCurrency(item.precioUnitario * item.cantidad)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <a href="/carrito" className="px-6 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors">
            Volver al carrito
          </a>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[var(--color-action)] text-white py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Enviar Pedido"}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Order Summary Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-6 sticky top-28">
          <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4">Resumen</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Subtotal ({items.length} prod.)</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Envio</span>
              <span className={`font-medium ${shipping === 0 ? "text-green-600" : ""}`}>
                {shipping === 0 ? "Gratis" : formatCurrency(shipping)}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-[var(--color-text-muted)]">
                Envio gratuito a partir de {formatCurrency(FREE_SHIPPING_THRESHOLD)}
              </p>
            )}
            <hr className="border-[var(--color-border)]" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-[var(--color-action)]">{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">* Precios sin IVA. El IVA se calculara en la factura final.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
