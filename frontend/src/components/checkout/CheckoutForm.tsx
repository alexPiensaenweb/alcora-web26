import { useState, useRef } from "react";
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
    telefono: string | null;
    direccion_envio: string | null;
    direccion_facturacion: string | null;
  };
  /** IBAN para instrucciones de transferencia */
  iban?: string;
}

export default function CheckoutForm({ user, iban }: CheckoutFormProps) {
  const items = useStore($cartList);
  const subtotal = useStore($cartSubtotal);
  const shipping = useStore($shippingCost);
  const total = useStore($cartTotal);

  const [step, setStep] = useState(1);
  const [direccionEnvio, setDireccionEnvio] = useState(
    user.direccion_envio || ""
  );
  const [direccionFacturacion, setDireccionFacturacion] = useState(
    user.direccion_facturacion || ""
  );
  const [mismaDir, setMismaDir] = useState(true);
  const [metodoPago, setMetodoPago] = useState<"transferencia" | "tarjeta">(
    "transferencia"
  );
  const [notasCliente, setNotasCliente] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderTotal, setOrderTotal] = useState<number>(0);

  // Hidden form ref para redirect a Redsys
  const redsysFormRef = useRef<HTMLFormElement>(null);

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

  // ─── Confirmacion: Transferencia ───
  if (orderId && metodoPago === "transferencia") {
    const displayIban = iban || "ESXX XXXX XXXX XXXX XXXX XXXX";
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-navy)] text-center mb-2">
          Pedido recibido
        </h2>
        <p className="text-center text-[var(--color-text-muted)] mb-6">
          Pedido <strong>#{orderId}</strong> registrado correctamente.
        </p>

        <div className="bg-[var(--color-bg-accent)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-navy)] mb-3">
            Instrucciones de transferencia
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">IBAN</span>
              <span className="font-mono font-semibold text-[var(--color-navy)]">
                {displayIban}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Concepto</span>
              <span className="font-semibold text-[var(--color-navy)]">
                Pedido #{orderId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Importe</span>
              <span className="font-bold text-[var(--color-action)]">
                {formatCurrency(orderTotal)}
              </span>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-4">
            Indique el numero de pedido en el concepto de la transferencia.
            Le confirmaremos la recepcion del pago por email.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <a
            href="/cuenta/pedidos"
            className="bg-[var(--color-action)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors"
          >
            Ver mis pedidos
          </a>
          <a
            href="/catalogo"
            className="border border-[var(--color-border)] text-[var(--color-navy)] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-bg-light)] transition-colors"
          >
            Seguir comprando
          </a>
        </div>
      </div>
    );
  }

  // ─── Confirmacion: Tarjeta (redireccion a Redsys) ───
  if (orderId && metodoPago === "tarjeta") {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-navy)] mb-2">
          Redirigiendo a la pasarela de pago...
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Pedido #{orderId} — Sera redirigido automaticamente.
        </p>

        {/* Formulario oculto para redirect a Redsys */}
        <form
          ref={redsysFormRef}
          id="redsys-form"
          method="POST"
          style={{ display: "none" }}
        >
          <input type="hidden" name="Ds_SignatureVersion" />
          <input type="hidden" name="Ds_MerchantParameters" />
          <input type="hidden" name="Ds_Signature" />
        </form>
      </div>
    );
  }

  // ─── Submit handler ───
  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      // 1. Crear pedido
      const res = await fetch("/api/cart/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
          })),
          direccion_envio: direccionEnvio,
          direccion_facturacion: mismaDir
            ? direccionEnvio
            : direccionFacturacion,
          metodo_pago: metodoPago,
          notas_cliente: notasCliente || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar el pedido");
      }

      const pedido = data.pedido;
      clearCart();
      setOrderId(pedido.id);
      setOrderTotal(pedido.total);

      // 2. Si tarjeta → solicitar firma Redsys y redirect al TPV
      if (metodoPago === "tarjeta") {
        const sigRes = await fetch("/api/checkout/redsys-signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedidoId: pedido.id }),
        });

        const sigData = await sigRes.json();

        if (!sigRes.ok) {
          throw new Error(sigData.error || "Error generando firma de pago");
        }

        // Auto-submit del formulario oculto hacia Redsys
        // Usamos setTimeout para dar tiempo a que React renderice el form
        setTimeout(() => {
          const form = document.getElementById("redsys-form") as HTMLFormElement;
          if (form) {
            form.action = sigData.redsysUrl;
            (form.querySelector('[name="Ds_SignatureVersion"]') as HTMLInputElement).value =
              sigData.Ds_SignatureVersion;
            (form.querySelector('[name="Ds_MerchantParameters"]') as HTMLInputElement).value =
              sigData.Ds_MerchantParameters;
            (form.querySelector('[name="Ds_Signature"]') as HTMLInputElement).value =
              sigData.Ds_Signature;
            form.submit();
          }
        }, 500);
      }
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
      <div className="flex-1">
        {/* Steps indicator */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className={`flex items-center gap-2 ${step >= 1 ? "text-[var(--color-action)]" : "text-[var(--color-text-muted)]"}`}
          >
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-[var(--color-action)] text-white" : "bg-[var(--color-bg-light)] text-[var(--color-text-muted)]"}`}
            >
              1
            </span>
            <span className="text-sm font-medium">Envio</span>
          </div>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <div
            className={`flex items-center gap-2 ${step >= 2 ? "text-[var(--color-action)]" : "text-[var(--color-text-muted)]"}`}
          >
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-[var(--color-action)] text-white" : "bg-[var(--color-bg-light)] text-[var(--color-text-muted)]"}`}
            >
              2
            </span>
            <span className="text-sm font-medium">Revision y pago</span>
          </div>
        </div>

        {/* Step 1: Shipping */}
        {step === 1 && (
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

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  if (!direccionEnvio.trim()) {
                    setError("Debe indicar una direccion de envio");
                    return;
                  }
                  if (!mismaDir && !direccionFacturacion.trim()) {
                    setError("Debe indicar una direccion de facturacion");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="bg-[var(--color-action)] text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review & Payment */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Address summary */}
            <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-[var(--color-navy)]">
                  Direccion de envio
                </h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-[var(--color-action)] hover:underline"
                >
                  Modificar
                </button>
              </div>
              <p className="text-sm text-[var(--color-text-muted)] whitespace-pre-line">
                {direccionEnvio}
              </p>
              {!mismaDir && (
                <>
                  <h3 className="text-sm font-semibold text-[var(--color-navy)] mt-3">
                    Direccion de facturacion
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] whitespace-pre-line">
                    {direccionFacturacion}
                  </p>
                </>
              )}
            </div>

            {/* Items summary */}
            <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--color-navy)] mb-4">
                Productos ({items.length})
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productoId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-navy)] truncate">
                        {item.nombre}
                      </p>
                      <p className="text-[var(--color-text-muted)]">
                        {item.cantidad} x {formatCurrency(item.precioUnitario)}
                      </p>
                    </div>
                    <span className="font-semibold text-[var(--color-navy)] ml-4">
                      {formatCurrency(item.precioUnitario * item.cantidad)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--color-navy)] mb-4">
                Metodo de pago
              </h2>
              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[var(--color-bg-light)] transition-colors ${
                    metodoPago === "transferencia"
                      ? "border-[var(--color-action)] bg-[var(--color-bg-accent)]"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="metodo_pago"
                    value="transferencia"
                    checked={metodoPago === "transferencia"}
                    onChange={() => setMetodoPago("transferencia")}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-navy)]">
                      Transferencia bancaria
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Recibira instrucciones con el IBAN y concepto al confirmar
                      el pedido.
                    </p>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[var(--color-bg-light)] transition-colors ${
                    metodoPago === "tarjeta"
                      ? "border-[var(--color-action)] bg-[var(--color-bg-accent)]"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="metodo_pago"
                    value="tarjeta"
                    checked={metodoPago === "tarjeta"}
                    onChange={() => setMetodoPago("tarjeta")}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-navy)]">
                      Tarjeta de credito / debito
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Pago seguro a traves de la pasarela Redsys. Sera
                      redirigido para completar el pago.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors"
              >
                Atras
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-[var(--color-action)] text-white py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50"
              >
                {loading
                  ? "Procesando..."
                  : metodoPago === "tarjeta"
                    ? "Pagar con tarjeta"
                    : "Confirmar pedido"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Order Summary Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-6 sticky top-28">
          <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4">
            Resumen
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">
                Subtotal ({items.length} prod.)
              </span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Envio</span>
              <span
                className={`font-medium ${shipping === 0 ? "text-green-600" : ""}`}
              >
                {shipping === 0 ? "Gratis" : formatCurrency(shipping)}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-[var(--color-text-muted)]">
                Envio gratuito a partir de{" "}
                {formatCurrency(FREE_SHIPPING_THRESHOLD)}
              </p>
            )}
            <hr className="border-[var(--color-border)]" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-[var(--color-action)]">
                {formatCurrency(total)}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              * Precios sin IVA. El IVA se calculara en la factura final.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
