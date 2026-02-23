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
    cif_nif: string | null;
    telefono: string | null;
    direccion_envio: string | null;
    direccion_facturacion: string | null;
    grupo_cliente: string | null;
  };
}

type MetodoPago = "tarjeta" | "bizum" | "pendiente";

export default function CheckoutForm({ user }: CheckoutFormProps) {
  const items = useStore($cartList);
  const subtotal = useStore($cartSubtotal);
  const shipping = useStore($shippingCost);
  const total = useStore($cartTotal);

  // Default payment method: tarjeta for particulares, pendiente for B2B
  const isParticular = user.grupo_cliente === "particular";
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(
    isParticular ? "tarjeta" : "pendiente"
  );

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

  // Hidden form ref for Redsys redirect
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

  // ─── Confirmacion de pedido (non-Redsys methods) ───
  const isRedsysMethod = metodoPago === "tarjeta" || metodoPago === "bizum";
  if (orderId && !isRedsysMethod) {
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
      // Step 1: Create the order
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
          metodo_pago: metodoPago,
          notas_cliente: notasCliente || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar el pedido");

      const newOrderId = data.pedido.id;
      clearCart();

      // Step 2: If Redsys payment (card or Bizum), initiate redirect
      if (metodoPago === "tarjeta" || metodoPago === "bizum") {
        setOrderId(newOrderId);

        // Get Redsys form data from our server
        const payRes = await fetch("/pago-api/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedidoId: newOrderId }),
        });

        const payData = await payRes.json();
        if (!payRes.ok) throw new Error(payData.error || "Error al iniciar el pago");

        // Auto-submit the hidden form to redirect to Redsys
        const form = redsysFormRef.current;
        if (form) {
          form.action = payData.redsysUrl;
          // Set hidden fields
          const sigVersion = form.querySelector<HTMLInputElement>('[name="Ds_SignatureVersion"]');
          const params = form.querySelector<HTMLInputElement>('[name="Ds_MerchantParameters"]');
          const sig = form.querySelector<HTMLInputElement>('[name="Ds_Signature"]');
          if (sigVersion) sigVersion.value = payData.formParams.Ds_SignatureVersion;
          if (params) params.value = payData.formParams.Ds_MerchantParameters;
          if (sig) sig.value = payData.formParams.Ds_Signature;
          form.submit();
        }
        return;
      }

      // Non-card: show confirmation
      setOrderId(newOrderId);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // ─── Render principal ───
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Hidden form for Redsys redirect (auto-submitted via JS) */}
      <form ref={redsysFormRef} method="POST" action="" style={{ display: "none" }}>
        <input type="hidden" name="Ds_SignatureVersion" value="" />
        <input type="hidden" name="Ds_MerchantParameters" value="" />
        <input type="hidden" name="Ds_Signature" value="" />
      </form>

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
            {user.razon_social && (
              <div>
                <span className="text-[var(--color-text-muted)]">Empresa: </span>
                <span className="text-[var(--color-navy)] font-medium">{user.razon_social}</span>
              </div>
            )}
            {user.cif_nif && (
              <div>
                <span className="text-[var(--color-text-muted)]">CIF/NIF: </span>
                <span className="text-[var(--color-navy)] font-medium">{user.cif_nif}</span>
              </div>
            )}
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

        {/* Payment method selector */}
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-navy)] mb-4">
            Metodo de pago
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMetodoPago("tarjeta")}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg text-left transition-colors ${
                metodoPago === "tarjeta"
                  ? "border-[var(--color-action)] bg-blue-50"
                  : "border-[var(--color-border)] hover:border-gray-400"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                metodoPago === "tarjeta" ? "border-[var(--color-action)]" : "border-gray-300"
              }`}>
                {metodoPago === "tarjeta" && (
                  <div className="w-3 h-3 rounded-full bg-[var(--color-action)]" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-navy)]">Tarjeta</p>
                <p className="text-xs text-[var(--color-text-muted)]">Visa, Mastercard</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMetodoPago("bizum")}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg text-left transition-colors ${
                metodoPago === "bizum"
                  ? "border-[var(--color-action)] bg-blue-50"
                  : "border-[var(--color-border)] hover:border-gray-400"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                metodoPago === "bizum" ? "border-[var(--color-action)]" : "border-gray-300"
              }`}>
                {metodoPago === "bizum" && (
                  <div className="w-3 h-3 rounded-full bg-[var(--color-action)]" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-navy)]">Bizum</p>
                <p className="text-xs text-[var(--color-text-muted)]">Pago desde el movil</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMetodoPago("pendiente")}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg text-left transition-colors ${
                metodoPago === "pendiente"
                  ? "border-[var(--color-action)] bg-blue-50"
                  : "border-[var(--color-border)] hover:border-gray-400"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                metodoPago === "pendiente" ? "border-[var(--color-action)]" : "border-gray-300"
              }`}>
                {metodoPago === "pendiente" && (
                  <div className="w-3 h-3 rounded-full bg-[var(--color-action)]" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-navy)]">Pendiente</p>
                <p className="text-xs text-[var(--color-text-muted)]">Contactaremos para acordar</p>
              </div>
            </button>
          </div>
          {(metodoPago === "tarjeta" || metodoPago === "bizum") && (
            <p className="mt-3 text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Sera redirigido a la pasarela segura de Redsys. Sus datos nunca pasan por nuestro servidor.
            </p>
          )}
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
            {loading
              ? "Procesando..."
              : metodoPago === "tarjeta"
                ? "Pagar con tarjeta"
                : metodoPago === "bizum"
                  ? "Pagar con Bizum"
                  : "Enviar Pedido"
            }
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
