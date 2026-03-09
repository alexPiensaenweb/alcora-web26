import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import {
  $cartList,
  updateQuantity,
  removeFromCart,
  clearCart,
} from "../../stores/cart";
import { FREE_SHIPPING_THRESHOLD } from "../../lib/shipping";
import { computeCheckoutSummary } from "../../lib/pricing";

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

interface CartPageProps {
  isLoggedIn?: boolean;
  grupoCliente?: string | null;
}

export default function CartPage({ isLoggedIn = false, grupoCliente = null }: CartPageProps) {
  const items = useStore($cartList);
  const [presupuestoLoading, setPresupuestoLoading] = useState(false);
  const [presupuestoSent, setPresupuestoSent] = useState(false);
  const [presupuestoId, setPresupuestoId] = useState<number | null>(null);
  const [presupuestoError, setPresupuestoError] = useState("");

  // Determine if B2C (guest or particular) vs B2B (professional)
  const isB2C = !isLoggedIn || grupoCliente === "particular" || !grupoCliente;
  const isProfessional = isLoggedIn && !!grupoCliente && grupoCliente !== "particular";

  // Compute checkout summary with IVA breakdown for B2C
  const summary = useMemo(() => {
    const mappedItems = items.map((item) => ({
      precioUnitario: item.precioUnitario,
      cantidad: item.cantidad,
      tipoIva: (item.tipoIva || 21) as number,
    }));
    return computeCheckoutSummary(mappedItems, isB2C);
  }, [items, isB2C]);

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
              className="bg-white border border-[var(--color-border)] rounded-lg p-3 sm:p-4"
            >
              {/* Top row: image + details + remove button */}
              <div className="flex items-start gap-3">
                {/* Image */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--color-bg-light)] rounded flex-shrink-0 overflow-hidden">
                  {item.imagen ? (
                    <img
                      src={`${getDirectusUrl()}/assets/${item.imagen}`}
                      alt={item.nombre}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-border)]">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <a
                    href={`/catalogo/${item.slug}`}
                    className="text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-action)] transition-colors line-clamp-2"
                  >
                    {item.nombre}
                  </a>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {item.sku}
                    {item.formato && ` | ${item.formato}`}
                  </p>
                </div>

                {/* Remove - top right */}
                <button
                  onClick={() => removeFromCart(item.productoId)}
                  className="flex-shrink-0 p-1 text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Bottom row: price + quantity + line total */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--color-border)]/40">
                {/* Unit price */}
                <p className="text-sm font-semibold text-[var(--color-action)]">
                  {formatCurrency(item.precioUnitario)}
                </p>

                {/* Quantity */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-[var(--color-border)] rounded text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors text-sm"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-[var(--color-border)] rounded text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Line total */}
                <p className="text-sm font-bold text-[var(--color-navy)]">
                  {formatCurrency(item.precioUnitario * item.cantidad)}
                </p>
              </div>
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
            {isB2C ? (
              <>
                {/* B2C: IVA breakdown */}
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Base imponible</span>
                  <span className="font-medium">{formatCurrency(summary.subtotalSinIva)}</span>
                </div>
                {summary.ivaGroups.map((group) => (
                  <div key={group.rate} className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">IVA {group.rate}%</span>
                    <span className="font-medium">{formatCurrency(group.ivaAmount)}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Envio</span>
                  <span className={`font-medium ${summary.shipping === 0 ? "text-green-600" : ""}`}>
                    {summary.shipping === 0
                      ? "Gratis"
                      : formatCurrency(summary.shipping + summary.shippingIva) + " (IVA incl.)"}
                  </span>
                </div>
                {summary.shipping > 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Envio gratuito a partir de {formatCurrency(FREE_SHIPPING_THRESHOLD)}
                  </p>
                )}
                <hr className="border-[var(--color-border)]" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-[var(--color-action)]">{formatCurrency(summary.total)}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">* Precios IVA incluido</p>
              </>
            ) : (
              <>
                {/* B2B: existing behavior without IVA */}
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Subtotal</span>
                  <span className="font-medium">{formatCurrency(summary.subtotalSinIva)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Envio</span>
                  <span className={`font-medium ${summary.shipping === 0 ? "text-green-600" : ""}`}>
                    {summary.shipping === 0 ? "Gratis" : formatCurrency(summary.shipping)}
                  </span>
                </div>
                {summary.shipping > 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Envio gratuito a partir de {formatCurrency(FREE_SHIPPING_THRESHOLD)}
                  </p>
                )}
                <hr className="border-[var(--color-border)]" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-[var(--color-action)]">{formatCurrency(summary.total)}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">* Precios sin IVA</p>
              </>
            )}
          </div>

          <a
            href="/checkout"
            className="block mt-6 w-full bg-[var(--color-action)] text-white text-center py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors"
          >
            {isB2C ? "Finalizar Compra" : "Tramitar Pedido"}
          </a>

          {isProfessional && (
            <>
              <button
                onClick={async () => {
                  setPresupuestoError("");
                  setPresupuestoLoading(true);
                  try {
                    const res = await fetch("/cart/presupuesto", {
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
                    if (data.presupuestoId) setPresupuestoId(data.presupuestoId);
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
                    ? "Presupuesto solicitado"
                    : "Solicitar Presupuesto Personalizado"}
              </button>

              {presupuestoSent && (
                <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p>Hemos recibido su solicitud de presupuesto{presupuestoId ? ` (#${presupuestoId})` : ""}.</p>
                  <p className="mt-1">Le enviaremos la respuesta por email a la mayor brevedad.</p>
                  {presupuestoId && (
                    <a
                      href={`/cuenta/pedidos/${presupuestoId}`}
                      className="inline-block mt-2 text-[var(--color-action)] hover:underline font-medium"
                    >
                      Ver presupuesto
                    </a>
                  )}
                </div>
              )}

              {presupuestoError && (
                <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                  {presupuestoError}
                </p>
              )}
            </>
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
