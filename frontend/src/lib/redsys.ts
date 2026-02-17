/**
 * Redsys Payment Gateway Helper
 *
 * Implementa la firma HMAC SHA-256 para la pasarela de pago Redsys.
 * Usa node-redsys-api internamente.
 *
 * Variables de entorno requeridas:
 *   REDSYS_SECRET        - Clave secreta SHA-256 del comercio
 *   REDSYS_MERCHANT_CODE - Codigo FUC del comercio
 *   REDSYS_TERMINAL      - Numero de terminal (normalmente "1")
 *   REDSYS_ENV           - "test" | "production"
 *   PUBLIC_SITE_URL      - URL publica del sitio (para URLs de retorno)
 */

import { Redsys } from "node-redsys-api";

// ─── Config ───

const REDSYS_SECRET = process.env.REDSYS_SECRET || import.meta.env.REDSYS_SECRET || "";
const REDSYS_MERCHANT_CODE = process.env.REDSYS_MERCHANT_CODE || import.meta.env.REDSYS_MERCHANT_CODE || "";
const REDSYS_TERMINAL = process.env.REDSYS_TERMINAL || import.meta.env.REDSYS_TERMINAL || "1";
const REDSYS_ENV = process.env.REDSYS_ENV || import.meta.env.REDSYS_ENV || "test";
const SITE_URL = process.env.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL || "http://localhost:4321";

/** URL del formulario de pago Redsys */
export const REDSYS_FORM_URL =
  REDSYS_ENV === "production"
    ? "https://sis.redsys.es/sis/realizarPago"
    : "https://sis-t.redsys.es/sis/realizarPago";

// ─── Crear parametros de pago ───

export interface RedsysPaymentParams {
  pedidoId: number;
  /** Importe total en EUR (ej: 125.50) */
  amount: number;
  /** Descripcion del pedido */
  description?: string;
}

export interface RedsysFormData {
  Ds_SignatureVersion: "HMAC_SHA256_V1";
  Ds_MerchantParameters: string;
  Ds_Signature: string;
  redsysUrl: string;
}

/**
 * Genera Ds_MerchantParameters y Ds_Signature para enviar al TPV.
 *
 * El orderId de Redsys debe ser alfanumerico, 4-12 caracteres,
 * empezando por 4 digitos. Usamos el pedidoId con padding.
 */
export function createPaymentForm(params: RedsysPaymentParams): RedsysFormData {
  if (!REDSYS_SECRET) throw new Error("REDSYS_SECRET no configurado");
  if (!REDSYS_MERCHANT_CODE) throw new Error("REDSYS_MERCHANT_CODE no configurado");

  const redsys = new Redsys();

  // Redsys espera importe en centimos, sin decimales
  const amountCents = Math.round(params.amount * 100).toString();

  // Order ID: 4 digitos + sufijo (max 12 chars). Ej: "0042" para pedido 42
  const orderId = params.pedidoId.toString().padStart(4, "0").slice(0, 12);

  const merchantParams = {
    DS_MERCHANT_AMOUNT: amountCents,
    DS_MERCHANT_ORDER: orderId,
    DS_MERCHANT_MERCHANTCODE: REDSYS_MERCHANT_CODE,
    DS_MERCHANT_CURRENCY: "978", // EUR
    DS_MERCHANT_TRANSACTIONTYPE: "0", // Autorizacion
    DS_MERCHANT_TERMINAL: REDSYS_TERMINAL,
    DS_MERCHANT_MERCHANTURL: `${SITE_URL}/api/webhooks/redsys`,
    DS_MERCHANT_URLOK: `${SITE_URL}/cuenta/pedidos/${params.pedidoId}?pago=ok`,
    DS_MERCHANT_URLKO: `${SITE_URL}/cuenta/pedidos/${params.pedidoId}?pago=ko`,
    DS_MERCHANT_MERCHANTNAME: "Alcora Salud Ambiental",
    DS_MERCHANT_CONSUMERLANGUAGE: "1", // Espanol
    DS_MERCHANT_PRODUCTDESCRIPTION: params.description || `Pedido #${params.pedidoId}`,
  };

  return {
    Ds_SignatureVersion: "HMAC_SHA256_V1",
    Ds_MerchantParameters: redsys.createMerchantParameters(merchantParams),
    Ds_Signature: redsys.createMerchantSignature(REDSYS_SECRET, merchantParams),
    redsysUrl: REDSYS_FORM_URL,
  };
}

// ─── Verificar notificacion del banco ───

export interface RedsysNotification {
  isValid: boolean;
  dsResponse: number;
  orderId: string;
  amount: number;
  merchantCode: string;
  /** true si Ds_Response entre 0000 y 0099 (pago OK) */
  isPaymentOk: boolean;
  raw: Record<string, any>;
}

/**
 * Decodifica y valida la notificacion de Redsys (POST desde el banco).
 *
 * Recibe Ds_MerchantParameters y Ds_Signature del body (form-urlencoded).
 */
export function verifyNotification(
  merchantParamsEncoded: string,
  signatureReceived: string
): RedsysNotification {
  if (!REDSYS_SECRET) throw new Error("REDSYS_SECRET no configurado");

  const redsys = new Redsys();

  // Decodificar parametros
  const decoded = redsys.decodeMerchantParameters(merchantParamsEncoded);

  // Generar firma esperada
  const expectedSignature = redsys.createMerchantSignatureNotif(
    REDSYS_SECRET,
    merchantParamsEncoded
  );

  // Validar firma
  const isValid = redsys.merchantSignatureIsValid(
    signatureReceived,
    expectedSignature
  );

  const dsResponse = parseInt(decoded.Ds_Response || decoded.DS_RESPONSE || "-1", 10);

  return {
    isValid,
    dsResponse,
    orderId: decoded.Ds_Order || decoded.DS_ORDER || "",
    amount: parseInt(decoded.Ds_Amount || decoded.DS_AMOUNT || "0", 10) / 100,
    merchantCode: decoded.Ds_MerchantCode || decoded.DS_MERCHANTCODE || "",
    isPaymentOk: isValid && dsResponse >= 0 && dsResponse < 100,
    raw: decoded,
  };
}
