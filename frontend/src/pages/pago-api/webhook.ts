/**
 * POST /pago-api/webhook
 *
 * Redsys webhook notification handler.
 * Called by Redsys servers after payment processing.
 *
 * - Receives form-urlencoded POST with Ds_MerchantParameters + Ds_Signature
 * - Verifies HMAC-SHA256 signature
 * - Updates pedido state (pagado or keeps aprobado_pendiente_pago)
 * - Sends confirmation emails
 * - Always returns 200 (to prevent Redsys retries)
 *
 * Security: CSRF exempt (configured in middleware.ts), verified by cryptographic signature.
 * No auth required - Redsys servers call this directly.
 */
import type { APIRoute } from "astro";
import { directusAdmin, purgeDirectusCache } from "../../lib/directus";
import { verifyNotification, extractPedidoId } from "../../lib/redsys";
import { sendMail, buildPedidoHtml, getCompanyEmail } from "../../lib/email";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Redsys sends form-urlencoded POST
    const contentType = request.headers.get("content-type") || "";
    let merchantParams: string;
    let signature: string;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      merchantParams = formData.get("Ds_MerchantParameters") as string || "";
      signature = formData.get("Ds_Signature") as string || "";
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      merchantParams = body.Ds_MerchantParameters || "";
      signature = body.Ds_Signature || "";
    } else {
      // Try form data anyway
      const text = await request.text();
      const params = new URLSearchParams(text);
      merchantParams = params.get("Ds_MerchantParameters") || "";
      signature = params.get("Ds_Signature") || "";
    }

    if (!merchantParams || !signature) {
      console.error("[webhook] Missing Ds_MerchantParameters or Ds_Signature");
      return ok();
    }

    // Verify cryptographic signature
    const result = verifyNotification(merchantParams, signature);

    if (!result.valid) {
      console.error("[webhook] Invalid signature:", result.errorMessage);
      return ok();
    }

    const { orderId, responseCode, authorisationCode } = result;
    const isApproved = responseCode >= 0 && responseCode <= 99;

    console.log(
      `[webhook] Order: ${orderId}, Response: ${responseCode}, Approved: ${isApproved}, Auth: ${authorisationCode}`
    );

    // Extract our pedido ID from the Redsys order ID
    const pedidoId = extractPedidoId(orderId);
    if (!pedidoId) {
      console.error("[webhook] Could not extract pedidoId from orderId:", orderId);
      return ok();
    }

    // Fetch pedido
    let pedido: any;
    try {
      const res = await directusAdmin(
        `/items/pedidos/${pedidoId}?fields=id,estado,total,subtotal,costo_envio,user_created,metodo_pago,direccion_envio,direccion_facturacion,notas_cliente,items.*`
      );
      pedido = res.data;
    } catch (err) {
      console.error("[webhook] Error fetching pedido:", err);
      return ok();
    }

    if (!pedido) {
      console.error("[webhook] Pedido not found:", pedidoId);
      return ok();
    }

    // Only process if pedido is still waiting for payment
    if (pedido.estado !== "aprobado_pendiente_pago") {
      console.log(`[webhook] Pedido ${pedidoId} already in state: ${pedido.estado}, skipping`);
      return ok();
    }

    if (isApproved) {
      // Payment approved - update to "pagado"
      try {
        await directusAdmin(`/items/pedidos/${pedidoId}`, {
          method: "PATCH",
          body: JSON.stringify({
            estado: "pagado",
            referencia_pago: `${orderId} / Auth: ${authorisationCode}`,
          }),
        });

        await purgeDirectusCache();
        console.log(`[webhook] Pedido ${pedidoId} updated to 'pagado'`);
      } catch (err) {
        console.error("[webhook] Error updating pedido:", err);
        return ok();
      }

      // Send confirmation emails
      await sendPaymentEmails(pedido, orderId, authorisationCode);
    } else {
      // Payment denied - log but keep in aprobado_pendiente_pago (user can retry)
      console.log(`[webhook] Payment denied for pedido ${pedidoId}: code ${responseCode}`);

      try {
        await directusAdmin(`/items/pedidos/${pedidoId}`, {
          method: "PATCH",
          body: JSON.stringify({
            referencia_pago: `DENEGADO - Codigo: ${responseCode} / Order: ${orderId}`,
          }),
        });
        await purgeDirectusCache();
      } catch (err) {
        console.error("[webhook] Error updating denied pedido:", err);
      }
    }

    return ok();
  } catch (err) {
    console.error("[webhook] Unexpected error:", err);
    return ok(); // Always return 200
  }
};

/** Always return 200 to Redsys to prevent retries */
function ok() {
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}

/** Send payment confirmation emails after successful payment */
async function sendPaymentEmails(pedido: any, redsysOrderId: string, authCode: string) {
  try {
    // Fetch user info
    const userId = typeof pedido.user_created === "object"
      ? pedido.user_created.id
      : pedido.user_created;

    let userInfo: any;
    try {
      const res = await directusAdmin(
        `/users/${userId}?fields=first_name,last_name,email,telefono,razon_social`
      );
      userInfo = res.data;
    } catch {
      console.error("[webhook] Could not fetch user for email:", userId);
      return;
    }

    if (!userInfo) return;

    const userName = [userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ") || "Cliente";
    const userEmail = userInfo.email;
    const userPhone = userInfo.telefono || "";
    const userCompany = userInfo.razon_social || "";

    const items = (pedido.items || []).map((item: any) => ({
      nombre: item.nombre_producto || "Producto",
      sku: item.sku || "",
      cantidad: item.cantidad || 0,
      precioUnitario: item.precio_unitario || 0,
    }));

    const emailBaseData = {
      pedidoId: pedido.id,
      userName,
      userEmail,
      userPhone,
      userCompany,
      direccionEnvio: pedido.direccion_envio || "",
      direccionFacturacion: pedido.direccion_facturacion || "",
      metodoPago: pedido.metodo_pago || "tarjeta",
      notasCliente: pedido.notas_cliente || null,
      items,
      subtotal: pedido.subtotal || 0,
      costoEnvio: pedido.costo_envio || 0,
      total: pedido.total || 0,
    };

    const companyEmail = await getCompanyEmail();

    // Send to company
    try {
      const adminHtml = buildPedidoHtml({
        ...emailBaseData,
        cta: { label: "Gestionar pedido", url: "https://tienda.alcora.es/gestion/pedidos" },
      });
      await sendMail({
        to: companyEmail,
        subject: `Pedido #${pedido.id} PAGADO (${pedido.metodo_pago === "bizum" ? "Bizum" : "tarjeta"}) - ${userCompany || userName}`,
        html: adminHtml,
        replyTo: userEmail,
      });
    } catch (emailErr) {
      console.error("[webhook] Error sending admin email:", emailErr);
    }

    // Send to customer
    try {
      const clientHtml = buildPedidoHtml({
        ...emailBaseData,
        cta: { label: "Ver mis pedidos", url: "https://tienda.alcora.es/cuenta/pedidos" },
      });
      await sendMail({
        to: userEmail,
        subject: `Pago confirmado - Pedido #${pedido.id} - Alcora`,
        html: clientHtml,
        replyTo: companyEmail,
      });
    } catch (emailErr) {
      console.error("[webhook] Error sending client email:", emailErr);
    }
  } catch (err) {
    console.error("[webhook] Error in sendPaymentEmails:", err);
  }
}
