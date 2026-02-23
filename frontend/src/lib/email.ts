/**
 * Email utility - uses Resend API
 * Set RESEND_API_KEY in .env
 * Set EMAIL_FROM in .env (default: Alcora <noreply@tienda.alcora.es>)
 *
 * Resend free plan: 100 emails/day, 3,000/month
 * Company contact email is read from Directus (empresa collection)
 */
import { Resend } from "resend";
import { getEmpresa } from "./directus";

const RESEND_API_KEY =
  process.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY || "";
const EMAIL_FROM =
  process.env.EMAIL_FROM || import.meta.env.EMAIL_FROM || "Alcora Salud Ambiental <noreply@tienda.alcora.es>";

const FALLBACK_COMPANY_EMAIL = "central@alcora.es";

const PUBLIC_SITE_URL =
  process.env.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL || "https://tienda.alcora.es";
const PUBLIC_DIRECTUS_URL =
  process.env.PUBLIC_DIRECTUS_URL || import.meta.env.PUBLIC_DIRECTUS_URL || "";

// Alcora logo from Directus assets (converted to PNG for email compatibility)
const LOGO_FILE_ID = "404d6bf9-d9dd-4411-9193-d8c7d3010c77";
const LOGO_URL = PUBLIC_DIRECTUS_URL
  ? `${PUBLIC_DIRECTUS_URL}/assets/${LOGO_FILE_ID}?format=png&width=180`
  : `${PUBLIC_SITE_URL}/assets/${LOGO_FILE_ID}?format=png&width=180`;

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

/** Get company contact email from Directus empresa collection */
let _cachedCompanyEmail: string | null = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function getCompanyEmail(): Promise<string> {
  const now = Date.now();
  if (_cachedCompanyEmail && now - _cacheTime < CACHE_TTL) {
    return _cachedCompanyEmail;
  }
  try {
    const empresa = await getEmpresa();
    _cachedCompanyEmail = empresa?.email || FALLBACK_COMPANY_EMAIL;
    _cacheTime = now;
    return _cachedCompanyEmail;
  } catch {
    return _cachedCompanyEmail || FALLBACK_COMPANY_EMAIL;
  }
}

interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send an email through Resend.
 */
export async function sendMail({ to, subject, html, replyTo }: SendMailOptions): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to];

  console.log(`sendMail: Sending to ${recipients.join(", ")} via Resend`);

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipients,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });

    if (error) {
      console.error("sendMail: Resend error:", error);
      throw new Error(`Error enviando email: ${error.message}`);
    }

    console.log("sendMail: Email sent successfully via Resend");
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Error enviando")) {
      throw err;
    }
    console.error("sendMail: Error:", err);
    throw new Error(
      `Cannot send email: ${err instanceof Error ? err.message : "unknown"}`
    );
  }
}

// ─── Shared email template parts ───

function emailHeader(title: string, subtitle?: string): string {
  return `
    <div style="padding:24px 32px 16px;text-align:center;">
      <img src="${LOGO_URL}" alt="Alcora Salud Ambiental" width="160" style="display:inline-block;max-width:160px;height:auto;" />
    </div>
    <div style="background:#222d54;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;">${title}</h1>
      ${subtitle ? `<p style="color:#a0a8c0;margin:4px 0 0;font-size:14px;">${subtitle}</p>` : ""}
    </div>`;
}

function emailCta(label: string, url: string): string {
  return `
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${url}" style="display:inline-block;background:#2970ff;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600;">${label}</a>
      </div>`;
}

function emailFooter(cta?: { label: string; url: string }): string {
  const ctaHtml = cta ? emailCta(cta.label, cta.url) : "";
  return `
    ${ctaHtml}
    <div style="background:#f4f6f9;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 8px;font-size:12px;color:#6b7589;">
        Alcora Salud Ambiental S.L. &mdash; <a href="${PUBLIC_SITE_URL}" style="color:#2970ff;text-decoration:none;">tienda.alcora.es</a>
      </p>
      <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.5;">
        Este mensaje ha sido enviado desde la tienda online de Alcora Salud Ambiental.<br>
        Consulte nuestra <a href="${PUBLIC_SITE_URL}/politica-privacidad" style="color:#9ca3af;text-decoration:underline;">politica de privacidad</a>.
      </p>
    </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Build presupuesto email HTML
 */
export function buildPresupuestoHtml(data: {
  presupuestoId?: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  userCompany: string;
  items: {
    nombre: string;
    sku: string;
    cantidad: number;
    precioUnitario: number;
    formato: string | null;
  }[];
  subtotal?: number;
  cta?: { label: string; url: string };
}): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${escapeHtml(item.nombre)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7589;">${escapeHtml(item.sku)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${item.formato ? escapeHtml(item.formato) : "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:center;">${item.cantidad}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">${Number(item.precioUnitario || 0).toFixed(2)} €</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #c0c4ce;">
    ${emailHeader(data.presupuestoId ? `Presupuesto #${data.presupuestoId}` : "Solicitud de Presupuesto", "Alcora Salud Ambiental")}

    <div style="padding:24px 32px;">
      <h2 style="color:#222d54;font-size:16px;margin:0 0 16px;">Datos del cliente</h2>
      <table style="width:100%;font-size:14px;margin-bottom:24px;">
        <tr><td style="padding:4px 0;color:#6b7589;width:120px;">Nombre:</td><td style="padding:4px 0;color:#222d54;font-weight:600;">${escapeHtml(data.userName)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Empresa:</td><td style="padding:4px 0;color:#222d54;font-weight:600;">${escapeHtml(data.userCompany)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Email:</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(data.userEmail)}" style="color:#2970ff;">${escapeHtml(data.userEmail)}</a></td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Telefono:</td><td style="padding:4px 0;color:#222d54;">${data.userPhone ? escapeHtml(data.userPhone) : "\u2014"}</td></tr>
      </table>

      <h2 style="color:#222d54;font-size:16px;margin:0 0 12px;">Productos solicitados</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f4f6f9;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7589;font-weight:600;">Producto</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7589;font-weight:600;">SKU</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7589;font-weight:600;">Formato</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7589;font-weight:600;">Uds.</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7589;font-weight:600;">Precio ud.</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      ${data.subtotal != null ? `
      <table style="width:100%;font-size:14px;margin-bottom:24px;">
        <tr><td style="padding:8px 0 0;text-align:right;font-weight:700;color:#222d54;font-size:16px;">Subtotal:</td><td style="padding:8px 0 0 16px;text-align:right;font-weight:700;color:#2970ff;font-size:16px;">${Number(data.subtotal).toFixed(2)} \u20AC</td></tr>
      </table>` : ""}

      <p style="font-size:13px;color:#6b7589;line-height:1.5;">
        * Precios sin IVA. Este presupuesto ha sido solicitado desde la tienda online.
        Los precios y condiciones quedan pendientes de confirmacion.
      </p>
    </div>

    ${emailFooter(data.cta)}
  </div>
</body>
</html>`;
}

/**
 * Build order confirmation email HTML (for company notification)
 */
export function buildPedidoHtml(data: {
  pedidoId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  userCompany: string;
  direccionEnvio: string;
  direccionFacturacion: string;
  metodoPago: string;
  notasCliente: string | null;
  items: {
    nombre: string;
    sku: string;
    cantidad: number;
    precioUnitario: number;
  }[];
  subtotal: number;
  costoEnvio: number;
  total: number;
  cta?: { label: string; url: string };
}): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${escapeHtml(item.nombre)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7589;">${escapeHtml(item.sku)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:center;">${item.cantidad}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">${Number(item.precioUnitario || 0).toFixed(2)} \u20AC</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;font-weight:600;">${(Number(item.precioUnitario || 0) * Number(item.cantidad || 0)).toFixed(2)} \u20AC</td>
      </tr>`
    )
    .join("");

  const metodoPagoLabels: Record<string, string> = {
    transferencia: "Transferencia bancaria",
    tarjeta: "Pago con tarjeta",
    pendiente: "Pendiente de confirmar",
  };
  const metodoPagoLabel = metodoPagoLabels[data.metodoPago] || "Pendiente de confirmar";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #c0c4ce;">
    ${emailHeader(`Nuevo Pedido #${data.pedidoId}`, "Alcora Salud Ambiental \u2014 Tienda Online")}

    <div style="padding:24px 32px;">
      <h2 style="color:#222d54;font-size:16px;margin:0 0 16px;">Datos del cliente</h2>
      <table style="width:100%;font-size:14px;margin-bottom:24px;">
        <tr><td style="padding:4px 0;color:#6b7589;width:140px;">Nombre:</td><td style="padding:4px 0;color:#222d54;font-weight:600;">${escapeHtml(data.userName)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Empresa:</td><td style="padding:4px 0;color:#222d54;font-weight:600;">${escapeHtml(data.userCompany)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Email:</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(data.userEmail)}" style="color:#2970ff;">${escapeHtml(data.userEmail)}</a></td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Telefono:</td><td style="padding:4px 0;color:#222d54;">${data.userPhone ? escapeHtml(data.userPhone) : "\u2014"}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Metodo de pago:</td><td style="padding:4px 0;color:#222d54;font-weight:600;">${escapeHtml(metodoPagoLabel)}</td></tr>
      </table>

      <h2 style="color:#222d54;font-size:16px;margin:0 0 8px;">Direcciones</h2>
      <table style="width:100%;font-size:14px;margin-bottom:24px;">
        <tr><td style="padding:4px 0;color:#6b7589;width:140px;">Envio:</td><td style="padding:4px 0;color:#222d54;">${escapeHtml(data.direccionEnvio)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Facturacion:</td><td style="padding:4px 0;color:#222d54;">${escapeHtml(data.direccionFacturacion)}</td></tr>
      </table>
      ${data.notasCliente ? `<div style="background:#eff4ff;border-left:3px solid #2970ff;padding:12px 16px;margin-bottom:24px;font-size:14px;color:#222d54;"><strong>Notas del cliente:</strong><br>${escapeHtml(data.notasCliente)}</div>` : ""}

      <h2 style="color:#222d54;font-size:16px;margin:0 0 12px;">Productos</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#f4f6f9;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7589;font-weight:600;">Producto</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7589;font-weight:600;">SKU</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7589;font-weight:600;">Uds.</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7589;font-weight:600;">Precio ud.</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7589;font-weight:600;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <table style="width:100%;font-size:14px;margin-bottom:24px;">
        <tr><td style="padding:4px 0;text-align:right;color:#6b7589;">Subtotal:</td><td style="padding:4px 0 4px 16px;text-align:right;color:#222d54;width:100px;">${Number(data.subtotal || 0).toFixed(2)} \u20AC</td></tr>
        <tr><td style="padding:4px 0;text-align:right;color:#6b7589;">Envio:</td><td style="padding:4px 0 4px 16px;text-align:right;color:#222d54;">${Number(data.costoEnvio || 0) === 0 ? "Gratis" : Number(data.costoEnvio || 0).toFixed(2) + " \u20AC"}</td></tr>
        <tr><td style="padding:8px 0 0;text-align:right;font-weight:700;color:#222d54;font-size:16px;">TOTAL:</td><td style="padding:8px 0 0 16px;text-align:right;font-weight:700;color:#2970ff;font-size:16px;">${Number(data.total || 0).toFixed(2)} \u20AC</td></tr>
      </table>

      <p style="font-size:13px;color:#6b7589;line-height:1.5;">
        * Precios sin IVA. Este pedido ha sido realizado desde la tienda online y requiere confirmacion.
      </p>
    </div>

    ${emailFooter(data.cta)}
  </div>
</body>
</html>`;
}

/**
 * Build user activation notification email HTML (sent to user when admin activates their account)
 */
export function buildActivacionHtml(data: {
  userName: string;
  userEmail: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #c0c4ce;">
    ${emailHeader("Su cuenta ha sido activada", "Alcora Salud Ambiental")}

    <div style="padding:24px 32px;">
      <p style="font-size:15px;color:#222d54;margin:0 0 16px;line-height:1.6;">
        Estimado/a <strong>${escapeHtml(data.userName)}</strong>,
      </p>
      <p style="font-size:14px;color:#222d54;margin:0 0 16px;line-height:1.6;">
        Le informamos de que su cuenta en la tienda online de Alcora Salud Ambiental ha sido <strong>activada</strong>.
      </p>
      <p style="font-size:14px;color:#222d54;margin:0 0 24px;line-height:1.6;">
        Ya puede acceder a su cuenta para consultar precios, realizar pedidos y solicitar presupuestos.
      </p>

      <div style="background:#eff4ff;border:1px solid #2970ff;border-radius:6px;padding:16px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#222d54;">
          Acceda con su email: <strong>${escapeHtml(data.userEmail)}</strong>
        </p>
      </div>

      <p style="font-size:13px;color:#6b7589;line-height:1.5;">
        Si tiene cualquier duda, no dude en contactarnos.
      </p>
    </div>

    ${emailFooter({ label: "Acceder a mi cuenta", url: `${PUBLIC_SITE_URL}/login` })}
  </div>
</body>
</html>`;
}

/**
 * Build welcome email HTML for B2C users (auto-activated on registration)
 */
export function buildBienvenidaHtml(data: {
  userName: string;
  userEmail: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #c0c4ce;">
    ${emailHeader("Bienvenido/a a Alcora", "Alcora Salud Ambiental")}

    <div style="padding:24px 32px;">
      <p style="font-size:15px;color:#222d54;margin:0 0 16px;line-height:1.6;">
        Hola <strong>${escapeHtml(data.userName)}</strong>,
      </p>
      <p style="font-size:14px;color:#222d54;margin:0 0 16px;line-height:1.6;">
        Su cuenta en la tienda online de Alcora Salud Ambiental ha sido creada correctamente.
      </p>
      <p style="font-size:14px;color:#222d54;margin:0 0 24px;line-height:1.6;">
        Ya puede explorar nuestro catalogo, realizar pedidos y pagar comodamente con tarjeta.
      </p>

      <div style="background:#eff4ff;border:1px solid #2970ff;border-radius:6px;padding:16px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#222d54;">
          Acceda con su email: <strong>${escapeHtml(data.userEmail)}</strong>
        </p>
      </div>

      <p style="font-size:13px;color:#6b7589;line-height:1.5;">
        Si tiene cualquier duda, no dude en contactarnos.
      </p>
    </div>

    ${emailFooter({ label: "Ir a la tienda", url: `${PUBLIC_SITE_URL}/catalogo` })}
  </div>
</body>
</html>`;
}

/**
 * Build new registration notification email HTML
 */
export function buildRegistroHtml(data: {
  firstName: string;
  lastName: string;
  email: string;
  razonSocial: string;
  cifNif: string;
  telefono: string;
  tipoNegocio: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #c0c4ce;">
    ${emailHeader("Nueva Solicitud de Registro", "Alcora Salud Ambiental \u2014 Tienda Online")}

    <div style="padding:24px 32px;">
      <p style="font-size:14px;color:#222d54;margin:0 0 16px;">
        Un nuevo usuario ha solicitado registrarse como cliente profesional. La cuenta esta pendiente de activacion.
      </p>

      <h2 style="color:#222d54;font-size:16px;margin:0 0 16px;">Datos del solicitante</h2>
      <table style="width:100%;font-size:14px;margin-bottom:24px;">
        <tr><td style="padding:4px 0;color:#6b7589;width:140px;">Nombre:</td><td style="padding:4px 0;color:#222d54;font-weight:600;">${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Empresa:</td><td style="padding:4px 0;color:#222d54;font-weight:600;">${escapeHtml(data.razonSocial)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">CIF/NIF:</td><td style="padding:4px 0;color:#222d54;font-weight:600;">${escapeHtml(data.cifNif)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Email:</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#2970ff;">${escapeHtml(data.email)}</a></td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Telefono:</td><td style="padding:4px 0;color:#222d54;">${data.telefono ? escapeHtml(data.telefono) : "\u2014"}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Tipo negocio:</td><td style="padding:4px 0;color:#222d54;">${escapeHtml(data.tipoNegocio)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Direccion:</td><td style="padding:4px 0;color:#222d54;">${escapeHtml(data.direccion)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Ciudad:</td><td style="padding:4px 0;color:#222d54;">${escapeHtml(data.ciudad)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Provincia:</td><td style="padding:4px 0;color:#222d54;">${escapeHtml(data.provincia)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">C.Postal:</td><td style="padding:4px 0;color:#222d54;">${escapeHtml(data.codigoPostal)}</td></tr>
      </table>

      <div style="background:#eff4ff;border:1px solid #2970ff;border-radius:6px;padding:16px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#222d54;">
          Para activar esta cuenta, acceda al panel de administracion y active el usuario.
        </p>
      </div>
    </div>

    ${emailFooter({ label: "Gestionar usuarios", url: `${PUBLIC_SITE_URL}/gestion/usuarios` })}
  </div>
</body>
</html>`;
}
