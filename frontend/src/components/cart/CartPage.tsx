import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  $cartList,
  $cartSubtotal,
  $shippingCost,
  $cartTotal,
  updateQuantity,
  removeFromCart,
  clearCart,
} from "../../stores/cart";
import { FREE_SHIPPING_THRESHOLD } from "../../lib/shipping";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function getDirectusUrl(): string {
  if (typeof document !== "undefined") {
    return document.body?.dataset?.directusUrl || (window as any).__PUBLIC_DIRECTUS_URL || "";
  }
  return "";
}

export default function CartPage() {
  const items = useStore($cartList);
  const subtotal = useStore($cartSubtotal);
  const shipping = useStore($shippingCost);
  const total = useStore($cartTotal);
  const [presupuestoLoading, setPresupuestoLoading] = useState(false);
  const [presupuestoSent, setPresupuestoSent] = useState(false);
  const [presupuestoError, setPresupuestoError] = useState("");

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-20 h-20 mx-auto mb-4 text-[var(--color-border)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-[var(--color-navy)] mb-2">
          Su carrito esta vacio
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Explore nuestro catalogo y anada productos.
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

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Items */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-navy)]">
            Carrito ({items.length} {items.length === 1 ? "producto" : "productos"})
          </h2>
          <button
            onClick={() => clearCart()}
            className="text-sm text-red-600 hover:underline"
          >
            Vaciar carrito
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productoId}
              className="flex items-center gap-4 p-4 bg-white border border-[var(--color-border)] rounded-lg"
            >
              {/* Image */}
              <div className="w-16 h-16 bg-[var(--color-bg-light)] rounded flex-shrink-0 overflow-hidden">
                {item.imagen ? (
                  <img
                    src={`${getDirectusUrl()}/assets/${item.imagen}`}
                    alt={item.nombre}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--color-border)]">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <a
                  href={`/catalogo/${item.slug}`}
                  className="text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-action)] transition-colors line-clamp-1"
                >
                  {item.nombre}
                </a>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {item.sku}
                  {item.formato && ` | ${item.formato}`}
                </p>
                <p className="text-sm font-semibold text-[var(--color-action)] mt-1">
                  {formatCurrency(item.precioUnitario)}
                </p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                  className="w-8 h-8 flex items-center justify-center border border-[var(--color-border)] rounded text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center text-sm font-medium">
                  {item.cantidad}
                </span>
                <button
                  onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                  className="w-8 h-8 flex items-center justify-center border border-[var(--color-border)] rounded text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors"
                >
                  +
                </button>
              </div>

              {/* Line total */}
              <div className="text-right flex-shrink-0 w-24">
                <p className="text-sm font-semibold text-[var(--color-navy)]">
                  {formatCurrency(item.precioUnitario * item.cantidad)}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(item.productoId)}
                className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-6 sticky top-28">
          <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4">
            Resumen del pedido
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Subtotal</span>
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
          </div>

          <a
            href="/checkout"
            className="block mt-6 w-full bg-[var(--color-action)] text-white text-center py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors"
          >
            Tramitar Pedido
          </a>

          <button
            onClick={async () => {
              setPresupuestoError("");
              setPresupuestoLoading(true);
              try {
                const res = await fetch("/api/cart/presupuesto", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    items: items.map((i) => ({
                      productoId: i.productoId,
                      nombre: i.nombre,
                      sku: i.sku,
                      cantidad: i.cantidad,
                      precioUnitario: i.precioUnitario,
                      formato: i.formato,
                    })),
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Error al solicitar presupuesto");
                setPresupuestoSent(true);
              } catch (err: any) {
                setPresupuestoError(err.message || "Error desconocido");
              } finally {
                setPresupuestoLoading(false);
              }
            }}
            disabled={presupuestoLoading || presupuestoSent}
            className="block mt-3 w-full border border-[var(--color-action)] text-[var(--color-action)] text-center py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-bg-accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {presupuestoLoading
              ? "Enviando..."
              : presupuestoSent
                ? "✓ Presupuesto solicitado"
                : "Solicitar Presupuesto Personalizado"}
          </button>

          {presupuestoSent && (
            <p className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2 text-center">
              Hemos recibido su solicitud. Le enviaremos el presupuesto por email a la mayor brevedad.
            </p>
          )}

          {presupuestoError && (
            <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 text-center">
              {presupuestoError}
            </p>
          )}

          <a
            href="/catalogo"
            className="block mt-3 text-center text-sm text-[var(--color-action)] hover:underline"
          >
            Seguir comprando
          </a>
        </div>
      </div>
    </div>
  );
}
