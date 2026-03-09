import { useState, useRef } from "react";
import { useStore } from "@nanostores/react";
import Turnstile from "react-turnstile";
import {
  $cartList,
  clearCart,
} from "../../stores/cart";
import { FREE_SHIPPING_THRESHOLD } from "../../lib/shipping";
import {
  formatCurrency,
  resolveUserType,
  getAllowedPaymentMethods,
  computeCheckoutSummary,
} from "../../lib/pricing";
import type { MetodoPago, UserType } from "../../lib/pricing";

// ─── Types ───

interface CheckoutUser {
  first_name: string | null;
  last_name: string | null;
  email: string;
  razon_social: string | null;
  cif_nif: string | null;
  telefono: string | null;
  direccion_envio: string | null;
  direccion_facturacion: string | null;
  grupo_cliente: string | null;
}

interface CheckoutFormProps {
  user: CheckoutUser | null;
  turnstileSiteKey: string;
}

type CheckoutMode = "choosing" | "guest" | "authenticated";

// ─── Component ───

export default function CheckoutForm({ user, turnstileSiteKey }: CheckoutFormProps) {
  const items = useStore($cartList);

  // Determine user type
  const userType: UserType = resolveUserType(user as { grupo_cliente: string | null } | null);
  const isB2C = userType !== "profesional";
  const allowedMethods = getAllowedPaymentMethods(userType);

  // Mode
  const [mode, setMode] = useState<CheckoutMode>(user ? "authenticated" : "choosing");

  // Payment
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(allowedMethods[0]);

  // Guest form fields
  const [guestNombre, setGuestNombre] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestTelefono, setGuestTelefono] = useState("");
  const [guestDireccion, setGuestDireccion] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  // Authenticated form fields
  const [direccionEnvio, setDireccionEnvio] = useState(
    user?.direccion_envio || user?.direccion_facturacion || ""
  );
  const [direccionFacturacion, setDireccionFacturacion] = useState(
    user?.direccion_facturacion || ""
  );
  const [mismaDir, setMismaDir] = useState(
    !user?.direccion_facturacion ||
      user?.direccion_facturacion === user?.direccion_envio ||
      !user?.direccion_envio
  );

  // Shared fields
  const [notasCliente, setNotasCliente] = useState("");
  const [aceptaLegal, setAceptaLegal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [presupuestoLoading, setPresupuestoLoading] = useState(false);

  // Hidden form ref for Redsys redirect
  const redsysFormRef = useRef<HTMLFormElement>(null);

  // ─── Empty cart ───
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

  // ─── Confirmation screen (non-Redsys methods) ───
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
          {user ? (
            <a href="/cuenta/pedidos" className="bg-[var(--color-action)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors">
              Ver mis pedidos
            </a>
          ) : null}
          <a href="/catalogo" className="border border-[var(--color-border)] text-[var(--color-navy)] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-bg-light)] transition-colors">
            Seguir comprando
          </a>
        </div>
      </div>
    );
  }

  // ─── Inline fork: choosing mode ───
  if (mode === "choosing") {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--color-navy)] mb-6">
            Como desea continuar?
          </h2>
          <div className="space-y-4">
            <div>
              <a
                href="/login?redirect=/checkout"
                className="block w-full bg-[var(--color-action)] text-white py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors text-center"
              >
                Iniciar sesion
              </a>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">
                No tiene cuenta?{" "}
                <a href="/registro?redirect=/checkout" className="text-[var(--color-action)] hover:underline">
                  Registrarse
                </a>
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[var(--color-text-muted)]">o</span>
              </div>
            </div>
            <button
              onClick={() => setMode("guest")}
              className="block w-full border-2 border-[var(--color-action)] text-[var(--color-action)] py-3 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Continuar como invitado
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Compute checkout summary ───
  const mappedItems = items.map((item) => ({
    precioUnitario: item.precioUnitario,
    cantidad: item.cantidad,
    tipoIva: item.tipoIva || 21,
  }));
  const summary = computeCheckoutSummary(mappedItems, isB2C);

  // ─── Submit handler ───
  async function handleSubmit() {
    setError("");

    // Legal validation
    if (!aceptaLegal) {
      setError("Debe aceptar las condiciones de venta, politica de devolucion y politica de privacidad");
      return;
    }

    if (mode === "guest") {
      // Guest validations
      if (!guestNombre.trim()) {
        setError("Debe indicar su nombre completo");
        return;
      }
      if (!guestEmail.trim()) {
        setError("Debe indicar un email valido");
        return;
      }
      if (!guestDireccion.trim()) {
        setError("Debe indicar una direccion de envio");
        return;
      }
      if (!turnstileToken) {
        setError("Debe completar la verificacion de seguridad");
        return;
      }
    } else {
      // Auth validations
      if (!direccionEnvio.trim()) {
        setError("Debe indicar una direccion de envio");
        return;
      }
      if (!mismaDir && !direccionFacturacion.trim()) {
        setError("Debe indicar una direccion de facturacion");
        return;
      }
    }

    setLoading(true);

    try {
      let newOrderId: number;
      let guestToken: string | null = null;

      if (mode === "guest") {
        // Step 1: Create guest order
        const res = await fetch("/cart/guest-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({
              productoId: i.productoId,
              cantidad: i.cantidad,
            })),
            guest_email: guestEmail,
            guest_nombre: guestNombre,
            guest_telefono: guestTelefono || undefined,
            guest_direccion: guestDireccion,
            metodo_pago: metodoPago,
            notas_cliente: notasCliente || undefined,
            turnstileToken,
            acepta_legal: true,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al enviar el pedido");

        newOrderId = data.pedido.id;
        guestToken = data.pedido.guest_token;
      } else {
        // Step 1: Create authenticated order
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
            acepta_legal: true,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al enviar el pedido");

        newOrderId = data.pedido.id;
      }

      clearCart();

      // Step 2: If Redsys payment (card or Bizum), initiate redirect
      if (metodoPago === "tarjeta" || metodoPago === "bizum") {
        setOrderId(newOrderId);

        const payBody: Record<string, unknown> = { pedidoId: newOrderId };
        if (guestToken) payBody.guest_token = guestToken;

        const payRes = await fetch("/pago-api/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payBody),
        });

        const payData = await payRes.json();
        if (!payRes.ok) throw new Error(payData.error || "Error al iniciar el pago");

        // Auto-submit the hidden form to redirect to Redsys
        const form = redsysFormRef.current;
        if (form) {
          form.action = payData.redsysUrl;
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

      // Non-Redsys: show confirmation
      setOrderId(newOrderId);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // ─── Presupuesto handler (professionals only) ───
  async function handlePresupuesto() {
    if (!aceptaLegal) {
      setError("Debe aceptar las condiciones de venta, politica de devolucion y politica de privacidad");
      return;
    }

    setPresupuestoLoading(true);
    setError("");

    try {
      const res = await fetch("/cart/presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productoId: i.productoId,
            nombre: i.nombre,
            sku: i.sku,
            slug: i.slug,
            imagen: i.imagen,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
            formato: i.formato,
          })),
          notas_cliente: notasCliente || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al solicitar presupuesto");

      clearCart();
      setOrderId(data.presupuestoId);
      // Set metodo_pago to pendiente so confirmation shows (not Redsys redirect)
      setMetodoPago("pendiente");
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setPresupuestoLoading(false);
    }
  }

  // ─── Payment method label map ───
  const paymentLabels: Record<string, { label: string; desc: string }> = {
    tarjeta: { label: "Tarjeta", desc: "Visa, Mastercard" },
    bizum: { label: "Bizum", desc: "Pago desde el movil" },
    pendiente: { label: "Confirmar pedido", desc: "Contactaremos para coordinar la forma de pago" },
  };

  // Submit button text
  function getSubmitButtonText() {
    if (loading) return "Procesando...";
    if (metodoPago === "tarjeta") return "Pagar con tarjeta";
    if (metodoPago === "bizum") return "Pagar con Bizum";
    return "Enviar Pedido";
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

        {/* ─── Guest form section ─── */}
        {mode === "guest" && (
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-navy)]">
                Datos de contacto
              </h2>
              <button
                type="button"
                onClick={() => setMode("choosing")}
                className="text-xs text-[var(--color-action)] hover:underline"
              >
                Volver
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={guestNombre}
                  onChange={(e) => setGuestNombre(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
                  placeholder="Nombre y apellidos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
                  Telefono (opcional)
                </label>
                <input
                  type="tel"
                  value={guestTelefono}
                  onChange={(e) => setGuestTelefono(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
                  placeholder="+34 600 000 000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">
                  Direccion de envio *
                </label>
                <textarea
                  value={guestDireccion}
                  onChange={(e) => setGuestDireccion(e.target.value)}
                  rows={3}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-action)]"
                  placeholder="Calle, numero, piso, codigo postal, ciudad, provincia"
                />
              </div>
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
              <div>
                <Turnstile
                  sitekey={turnstileSiteKey}
                  onVerify={(token: string) => setTurnstileToken(token)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── Authenticated user section ─── */}
        {mode === "authenticated" && user && (
          <>
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
                    {[user.first_name, user.last_name].filter(Boolean).join(" ") || "\u2014"}
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
          </>
        )}

        {/* ─── Payment method selector ─── */}
        {(mode === "guest" || mode === "authenticated") && (
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[var(--color-navy)] mb-4">
              Metodo de pago
            </h2>
            <div className={`grid grid-cols-1 ${allowedMethods.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
              {allowedMethods.map((method) => {
                const info = paymentLabels[method];
                if (!info) return null;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setMetodoPago(method)}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg text-left transition-colors ${
                      metodoPago === method
                        ? "border-[var(--color-action)] bg-blue-50"
                        : "border-[var(--color-border)] hover:border-gray-400"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      metodoPago === method ? "border-[var(--color-action)]" : "border-gray-300"
                    }`}>
                      {metodoPago === method && (
                        <div className="w-3 h-3 rounded-full bg-[var(--color-action)]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-navy)]">{info.label}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{info.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {(metodoPago === "tarjeta" || metodoPago === "bizum") && (
              <p className="mt-3 text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Sera redirigido a la pasarela segura de Redsys. Sus datos nunca pasan por nuestro servidor.
              </p>
            )}

            {/* Solicitar presupuesto - professionals only */}
            {userType === "profesional" && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={handlePresupuesto}
                  disabled={presupuestoLoading || loading}
                  className="w-full border-2 border-[var(--color-action)] text-[var(--color-action)] py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {presupuestoLoading ? "Solicitando..." : "Solicitar presupuesto"}
                </button>
                <p className="mt-1 text-xs text-[var(--color-text-muted)] text-center">
                  Le enviaremos un presupuesto personalizado por email
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Legal checkbox ─── */}
        {(mode === "guest" || mode === "authenticated") && (
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
            <label className="flex items-start gap-2 text-sm text-[var(--color-navy)]">
              <input
                type="checkbox"
                checked={aceptaLegal}
                onChange={(e) => setAceptaLegal(e.target.checked)}
                className="mt-1 rounded border-[var(--color-border)]"
              />
              <span>
                Acepto las{" "}
                <a href="/condiciones-venta" target="_blank" rel="noopener" className="text-[var(--color-action)] underline">condiciones de venta</a>
                , la{" "}
                <a href="/politica-devoluciones" target="_blank" rel="noopener" className="text-[var(--color-action)] underline">politica de devolucion</a>
                {" "}y la{" "}
                <a href="/politica-privacidad" target="_blank" rel="noopener" className="text-[var(--color-action)] underline">politica de privacidad</a>
              </span>
            </label>
          </div>
        )}

        {/* ─── Items summary ─── */}
        {(mode === "guest" || mode === "authenticated") && (
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
        )}

        {/* ─── Submit ─── */}
        {(mode === "guest" || mode === "authenticated") && (
          <>
            <div className="flex items-center gap-4">
              <a href="/carrito" className="px-6 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-bg-light)] transition-colors">
                Volver al carrito
              </a>
              <button
                onClick={handleSubmit}
                disabled={loading || presupuestoLoading}
                className="flex-1 bg-[var(--color-action)] text-white py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50"
              >
                {getSubmitButtonText()}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Order Summary Sidebar ─── */}
      {(mode === "guest" || mode === "authenticated") && (
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-6 sticky top-28">
            <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4">Resumen</h3>
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
                      {summary.shipping === 0 ? "Gratis" : formatCurrency(summary.shipping + summary.shippingIva) + " (IVA incl.)"}
                    </span>
                  </div>
                  {summary.shipping > 0 && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      IVA envio (21%): {formatCurrency(summary.shippingIva)}
                    </p>
                  )}
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
                </>
              ) : (
                <>
                  {/* B2B: no IVA breakdown */}
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Subtotal ({items.length} prod.)</span>
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
          </div>
        </div>
      )}
    </div>
  );
}
