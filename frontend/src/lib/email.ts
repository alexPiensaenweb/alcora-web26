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

  const res = await fetch(`${DIRECTUS_URL}/utils/send-mail`, {
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

  if (!res.ok) {
    const text = await res.text();
    console.error("Directus send-mail error:", res.status, text);
    throw new Error(`Error enviando email: ${res.status}`);
  }
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
