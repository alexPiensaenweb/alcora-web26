/**
 * Email utility - uses Directus /utils/send-mail endpoint
 * SMTP is already configured in Directus.
 */

const DIRECTUS_URL =
  import.meta.env.DIRECTUS_URL || process.env.DIRECTUS_URL || "http://127.0.0.1:8055";
const ADMIN_TOKEN =
  import.meta.env.DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || "";

interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Send an email through Directus SMTP.
 * Uses the admin static token for authentication.
 */
export async function sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to];

  if (!ADMIN_TOKEN) {
    console.error("sendMail: DIRECTUS_ADMIN_TOKEN is not configured");
    throw new Error("Email service not configured (missing admin token)");
  }

  const url = `${DIRECTUS_URL}/utils/send-mail`;
  console.log(`sendMail: Sending to ${recipients.join(", ")} via ${url}`);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        to: recipients,
        subject,
        html,
      }),
    });
  } catch (fetchErr) {
    console.error("sendMail: Network error connecting to Directus:", fetchErr);
    throw new Error(`Cannot connect to email service: ${fetchErr instanceof Error ? fetchErr.message : "unknown"}`);
  }

  if (!res.ok) {
    const text = await res.text();
    console.error(`sendMail: Directus returned ${res.status}:`, text);
    throw new Error(`Error enviando email: ${res.status} - ${text.substring(0, 200)}`);
  }

  console.log("sendMail: Email sent successfully");
}

/** Centralized company notification emails */
export const COMPANY_EMAILS = ["alex@piensaenweb.com"];

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
}): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${escapeHtml(item.nombre)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7589;">${escapeHtml(item.sku)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${item.formato ? escapeHtml(item.formato) : "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:center;">${item.cantidad}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">${item.precioUnitario.toFixed(2)} €</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #c0c4ce;">

    <div style="background:#222d54;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;">Solicitud de Presupuesto</h1>
      <p style="color:#a0a8c0;margin:4px 0 0;font-size:14px;">Alcora Salud Ambiental</p>
    </div>

    <div style="padding:24px 32px;">
      <h2 style="color:#222d54;font-size:16px;margin:0 0 16px;">Datos del cliente</h2>
      <table style="width:100%;font-size:14px;margin-bottom:24px;">
        <tr><td style="padding:4px 0;color:#6b7589;width:120px;">Nombre:</td><td style="padding:4px 0;color:#222d54;font-weight:600;">${escapeHtml(data.userName)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Empresa:</td><td style="padding:4px 0;color:#222d54;font-weight:600;">${escapeHtml(data.userCompany)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Email:</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(data.userEmail)}" style="color:#2970ff;">${escapeHtml(data.userEmail)}</a></td></tr>
        <tr><td style="padding:4px 0;color:#6b7589;">Telefono:</td><td style="padding:4px 0;color:#222d54;">${data.userPhone ? escapeHtml(data.userPhone) : "—"}</td></tr>
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

      <p style="font-size:13px;color:#6b7589;line-height:1.5;">
        Este presupuesto ha sido solicitado desde la tienda online.
        Por favor, contacten con el cliente para confirmar condiciones y plazos.
      </p>
    </div>

    <div style="background:#f4f6f9;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#6b7589;">
        Alcora Salud Ambiental S.L. — <a href="https://tienda.alcora.es" style="color:#2970ff;">tienda.alcora.es</a>
      </p>
    </div>
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
}): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${escapeHtml(item.nombre)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7589;">${escapeHtml(item.sku)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:center;">${item.cantidad}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">${item.precioUnitario.toFixed(2)} \u20AC</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;font-weight:600;">${(item.precioUnitario * item.cantidad).toFixed(2)} \u20AC</td>
      </tr>`
    )
    .join("");

  const metodoPagoLabel = data.metodoPago === "transferencia" ? "Transferencia bancaria" : "Pendiente de confirmar";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #c0c4ce;">

    <div style="background:#222d54;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;">Nuevo Pedido #${data.pedidoId}</h1>
      <p style="color:#a0a8c0;margin:4px 0 0;font-size:14px;">Alcora Salud Ambiental - Tienda Online</p>
    </div>

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
        <tr><td style="padding:4px 0;text-align:right;color:#6b7589;">Subtotal:</td><td style="padding:4px 0 4px 16px;text-align:right;color:#222d54;width:100px;">${data.subtotal.toFixed(2)} \u20AC</td></tr>
        <tr><td style="padding:4px 0;text-align:right;color:#6b7589;">Envio:</td><td style="padding:4px 0 4px 16px;text-align:right;color:#222d54;">${data.costoEnvio === 0 ? "Gratis" : data.costoEnvio.toFixed(2) + " \u20AC"}</td></tr>
        <tr><td style="padding:8px 0 0;text-align:right;font-weight:700;color:#222d54;font-size:16px;">TOTAL:</td><td style="padding:8px 0 0 16px;text-align:right;font-weight:700;color:#2970ff;font-size:16px;">${data.total.toFixed(2)} \u20AC</td></tr>
      </table>

      <p style="font-size:13px;color:#6b7589;line-height:1.5;">
        * Precios sin IVA. Este pedido ha sido realizado desde la tienda online y requiere confirmacion.
      </p>
    </div>

    <div style="background:#f4f6f9;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#6b7589;">
        Alcora Salud Ambiental S.L. \u2014 <a href="https://tienda.alcora.es" style="color:#2970ff;">tienda.alcora.es</a>
      </p>
    </div>
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

    <div style="background:#222d54;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;">Nueva Solicitud de Registro</h1>
      <p style="color:#a0a8c0;margin:4px 0 0;font-size:14px;">Alcora Salud Ambiental - Tienda Online</p>
    </div>

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
          Para activar esta cuenta, acceda al <a href="https://tienda.alcora.es/admin" style="color:#2970ff;font-weight:600;">panel de Directus</a> y cambie el estado del usuario a <strong>Activo</strong>.
        </p>
      </div>
    </div>

    <div style="background:#f4f6f9;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#6b7589;">
        Alcora Salud Ambiental S.L. \u2014 <a href="https://tienda.alcora.es" style="color:#2970ff;">tienda.alcora.es</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
