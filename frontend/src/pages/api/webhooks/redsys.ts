import type { APIRoute } from "astro";
import { verifyNotification } from "../../../lib/redsys";
import { directusAdmin } from "../../../lib/directus";

/**
 * POST /api/webhooks/redsys
 *
 * Notificacion asincrona desde Redsys (Ds_MerchantURL).
 * El banco envia los parametros como application/x-www-form-urlencoded.
 *
 * Si la firma es valida y Ds_Response entre 0000-0099:
 *   → Actualiza el pedido a estado "pagado" en Directus.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type") || "";

    let merchantParams: string;
    let signature: string;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      merchantParams =
        (formData.get("Ds_MerchantParameters") as string) ||
        (formData.get("DS_MERCHANTPARAMETERS") as string) ||
        "";
      signature =
        (formData.get("Ds_Signature") as string) ||
        (formData.get("DS_SIGNATURE") as string) ||
        "";
    } else {
      // Fallback JSON (entornos de test)
      const body = await request.json();
      merchantParams = body.Ds_MerchantParameters || body.DS_MERCHANTPARAMETERS || "";
      signature = body.Ds_Signature || body.DS_SIGNATURE || "";
    }

    if (!merchantParams || !signature) {
      console.error("Redsys webhook: missing params or signature");
      return new Response("Missing parameters", { status: 400 });
    }

    const result = verifyNotification(merchantParams, signature);

    console.log("Redsys notification:", {
      orderId: result.orderId,
      dsResponse: result.dsResponse,
      isValid: result.isValid,
      isPaymentOk: result.isPaymentOk,
      amount: result.amount,
    });

    if (!result.isValid) {
      console.error("Redsys webhook: invalid signature");
      return new Response("Invalid signature", { status: 403 });
    }

    if (result.isPaymentOk) {
      const pedidoId = parseInt(result.orderId, 10);

      if (pedidoId) {
        // Fetch order to verify amount and state
        let pedido: any;
        try {
          const pedidoRes = await directusAdmin(
            `/items/pedidos/${pedidoId}?fields=id,total,estado`
          );
          pedido = pedidoRes.data;
        } catch {
          console.error(`Redsys webhook: could not fetch pedido ${pedidoId}`);
          return new Response("Order not found", { status: 404 });
        }

        if (!pedido) {
          console.error(`Redsys webhook: pedido ${pedidoId} not found`);
          return new Response("Order not found", { status: 404 });
        }

        // Verify order is in correct state
        if (pedido.estado !== "aprobado_pendiente_pago") {
          console.error(`Redsys webhook: pedido ${pedidoId} in unexpected state: ${pedido.estado}`);
          return new Response("Invalid order state", { status: 400 });
        }

        // Verify amount matches (compare in cents to avoid floating-point issues)
        const expectedCents = Math.round(parseFloat(pedido.total) * 100);
        const paidCents = Math.round(result.amount * 100);
        if (expectedCents !== paidCents) {
          console.error(`Redsys webhook: amount mismatch for pedido ${pedidoId}: expected ${expectedCents} cents, received ${paidCents} cents`);
          return new Response("Amount mismatch", { status: 400 });
        }

        // Verify merchant code
        const expectedMerchantCode = process.env.REDSYS_MERCHANT_CODE || import.meta.env.REDSYS_MERCHANT_CODE || "";
        if (expectedMerchantCode && result.merchantCode !== expectedMerchantCode) {
          console.error(`Redsys webhook: merchant code mismatch`);
          return new Response("Invalid merchant code", { status: 403 });
        }

        await directusAdmin(`/items/pedidos/${pedidoId}`, {
          method: "PATCH",
          body: JSON.stringify({
            estado: "pagado",
            referencia_pago: `REDSYS-${result.orderId}-${result.dsResponse}`,
          }),
        });
        console.log(`Pedido ${pedidoId} marcado como pagado (Redsys OK, Ds_Response=${result.dsResponse})`);
      }
    } else {
      console.log(`Redsys pago rechazado: order=${result.orderId}, response=${result.dsResponse}`);
    }

    // Redsys espera un 200 OK para confirmar recepcion
    return new Response("OK", { status: 200 });
  } catch (err: any) {
    console.error("Redsys webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
};
