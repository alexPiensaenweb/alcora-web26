/**
 * Shipping Calculator
 *
 * Regla: Envio 15€ + IVA. Gratis si subtotal >= 500€ (sin IVA).
 */

export const SHIPPING_COST = 15;
export const FREE_SHIPPING_THRESHOLD = 500;

export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}

export function getShippingMessage(subtotal: number): string {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return "Envio gratuito";
  }
  const remaining = FREE_SHIPPING_THRESHOLD - Number(subtotal || 0);
  return `Envio: ${SHIPPING_COST}€ (faltan ${remaining.toFixed(2)}€ para envio gratis)`;
}
