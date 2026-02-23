/**
 * Redsys Payment Gateway - Server-side only
 *
 * Wraps redsys-easy for secure payment processing.
 * Uses redirect integration (SAQ-A compliant: no card data touches our server).
 */

import {
  createRedsysAPI,
  PRODUCTION_URLS,
  SANDBOX_URLS,
  TRANSACTION_TYPES,
  CURRENCIES,
  randomTransactionId,
} from "redsys-easy";

// ─── Configuration ───

function getConfig() {
  const merchantCode =
    process.env.REDSYS_MERCHANT_CODE || import.meta.env.REDSYS_MERCHANT_CODE;
  const secretKey =
    process.env.REDSYS_SECRET_KEY || import.meta.env.REDSYS_SECRET_KEY;
  const terminal =
    process.env.REDSYS_TERMINAL || import.meta.env.REDSYS_TERMINAL || "001";
  const env =
    process.env.REDSYS_ENV || import.meta.env.REDSYS_ENV || "production";

  if (!merchantCode || !secretKey) {
    throw new Error("REDSYS_MERCHANT_CODE y REDSYS_SECRET_KEY deben estar configurados");
  }

  return { merchantCode, secretKey, terminal, env };
}

function getUrls() {
  const { env } = getConfig();
  return env === "production" ? PRODUCTION_URLS : SANDBOX_URLS;
}

function getApi() {
  const { secretKey } = getConfig();
  return createRedsysAPI({ secretKey, urls: getUrls() });
}

// ─── Generate unique order ID ───
// Redsys Ds_Order: 4-12 alphanumeric characters, must start with 4 digits
function generateOrderId(pedidoId: number): string {
  const prefix = String(pedidoId).padStart(4, "0").slice(0, 8);
  const suffix = randomTransactionId().slice(0, 4);
  return `${prefix}${suffix}`;
}

// ─── Create Payment Request ───

/** Payment channel: card (Visa/MC) or Bizum */
export type RedsysPayMethod = "card" | "bizum";

interface PaymentRequestInput {
  pedidoId: number;
  totalEur: number;
  merchantUrl: string; // Webhook notification URL (absolute)
  urlOk: string;       // Success redirect URL
  urlKo: string;       // Failure redirect URL
  payMethod?: RedsysPayMethod; // default: "card"
}

interface PaymentRequestOutput {
  redsysUrl: string;
  formParams: {
    Ds_SignatureVersion: string;
    Ds_MerchantParameters: string;
    Ds_Signature: string;
  };
  redsysOrderId: string;
}

export function createPaymentRequest(input: PaymentRequestInput): PaymentRequestOutput {
  const { merchantCode, terminal } = getConfig();
  const api = getApi();

  const redsysOrderId = generateOrderId(input.pedidoId);

  // Amount in smallest currency unit (cents for EUR)
  const amountInCents = Math.round(input.totalEur * 100).toString();

  // Redsys PayMethods: "C" = card only, "z" = Bizum, "T" = transfer, etc.
  const payMethodCode = input.payMethod === "bizum" ? "z" : "C";

  const form = api.createRedirectForm({
    DS_MERCHANT_MERCHANTCODE: merchantCode,
    DS_MERCHANT_TERMINAL: terminal,
    DS_MERCHANT_TRANSACTIONTYPE: TRANSACTION_TYPES.AUTHORIZATION,
    DS_MERCHANT_ORDER: redsysOrderId,
    DS_MERCHANT_AMOUNT: amountInCents,
    DS_MERCHANT_CURRENCY: CURRENCIES.EUR.num,
    DS_MERCHANT_MERCHANTURL: input.merchantUrl,
    DS_MERCHANT_URLOK: input.urlOk,
    DS_MERCHANT_URLKO: input.urlKo,
    DS_MERCHANT_CONSUMERLANGUAGE: "001", // Spanish
    DS_MERCHANT_PAYMETHODS: payMethodCode,
  });

  return {
    redsysUrl: getUrls().redirect,
    formParams: {
      Ds_SignatureVersion: form.Ds_SignatureVersion,
      Ds_MerchantParameters: form.Ds_MerchantParameters,
      Ds_Signature: form.Ds_Signature,
    },
    redsysOrderId,
  };
}

// ─── Verify Webhook Notification ───

interface NotificationResult {
  valid: boolean;
  orderId: string;
  responseCode: number;
  authorisationCode: string;
  amount: number; // In cents
  errorMessage?: string;
}

export function verifyNotification(
  merchantParams: string,
  signature: string
): NotificationResult {
  try {
    const api = getApi();

    const result = api.processRedirectNotification({
      Ds_SignatureVersion: "HMAC_SHA256_V1",
      Ds_MerchantParameters: merchantParams,
      Ds_Signature: signature,
    });

    // processRedirectNotification throws if signature is invalid
    // If we get here, signature is valid

    const responseCode = parseInt(result.Ds_Response || "9999", 10);
    const isApproved = responseCode >= 0 && responseCode <= 99;

    return {
      valid: true,
      orderId: result.Ds_Order || "",
      responseCode,
      authorisationCode: result.Ds_AuthorisationCode || "",
      amount: parseInt(result.Ds_Amount || "0", 10),
      errorMessage: isApproved ? undefined : `Redsys response code: ${responseCode}`,
    };
  } catch (err) {
    console.error("[redsys] Notification verification failed:", err instanceof Error ? err.message : err);
    return {
      valid: false,
      orderId: "",
      responseCode: -1,
      authorisationCode: "",
      amount: 0,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Extract pedido ID from Redsys order ───
// Our order format: "0042XXXX" where 0042 is the padded pedido ID
export function extractPedidoId(redsysOrderId: string): number {
  // Take the numeric prefix (removing leading zeros)
  const numericPart = redsysOrderId.replace(/[^0-9]/g, "");
  // The pedido ID is the first 4-8 digits before the random suffix
  // Since we pad to at least 4 digits and add 4 random chars at the end,
  // the pedido ID is everything except the last 4 chars
  const pedidoDigits = numericPart.slice(0, -4) || numericPart;
  return parseInt(pedidoDigits, 10) || 0;
}

/**
 * Check if Redsys is configured (env vars present)
 */
export function isRedsysConfigured(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}
