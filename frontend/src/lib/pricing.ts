/**
 * Pricing Engine - Calcula precios con descuentos por grupo de cliente
 *
 * Prioridad de descuento:
 * 1. Tarifa especifica para el producto
 * 2. Tarifa por categoria del producto
 * 3. Tarifa global del grupo (producto y categoria = null)
 */

import type { TarifaEspecial } from "./types";
import { calculateShipping } from "./shipping";

export function resolveDiscount(
  tarifas: TarifaEspecial[],
  productoId: string,
  categoriaId: number | null
): number {
  // 1. Product-specific
  const productTarifa = tarifas.find(
    (t) => t.producto === productoId
  );
  if (productTarifa) return productTarifa.descuento_porcentaje;

  // 2. Category-specific
  if (categoriaId) {
    const catTarifa = tarifas.find(
      (t) => t.categoria === categoriaId && t.producto === null
    );
    if (catTarifa) return catTarifa.descuento_porcentaje;
  }

  // 3. Global group discount (both null)
  const globalTarifa = tarifas.find(
    (t) => t.producto === null && t.categoria === null
  );
  if (globalTarifa) return globalTarifa.descuento_porcentaje;

  return 0;
}

export function calculatePrice(
  precioBase: number,
  descuentoPorcentaje: number
): number {
  const discount = Math.max(0, Math.min(100, descuentoPorcentaje));
  return Math.round(precioBase * (1 - discount / 100) * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/**
 * Calculate B2C price with IVA included.
 * Used for visitors and particulares viewing B2C/ambos products.
 * Spanish law (Ley 7/1996) requires consumer prices include IVA.
 */
export function calculateB2CPrice(precioBase: number, tipoIva: 21 | 10 | 4 = 21): number {
  return Math.round(precioBase * (1 + tipoIva / 100) * 100) / 100;
}

/**
 * Determine if a user is a professional (B2B pricing).
 * Professionals: any grupo_cliente except 'particular' and null.
 */
export function isProfessionalUser(user: { grupo_cliente: string | null } | null): boolean {
  return !!user?.grupo_cliente && user.grupo_cliente !== 'particular';
}

// ─── Payment method restrictions by user type ───

export type UserType = 'guest' | 'particular' | 'profesional';

export type MetodoPago = 'tarjeta' | 'bizum' | 'pendiente' | 'transferencia';

/**
 * Returns allowed payment methods for a user type.
 * Used by both UI (to filter visible options) and server (to validate submissions).
 * - Guests and particulares: tarjeta + bizum only (FR-5.1)
 * - Professionals: tarjeta + bizum + pendiente (FR-6.4)
 *   Note: "pendiente" maps to "Confirmar pedido" in UI (FR-6.1)
 */
export function getAllowedPaymentMethods(userType: UserType): MetodoPago[] {
  switch (userType) {
    case 'guest':
    case 'particular':
      return ['tarjeta', 'bizum'];
    case 'profesional':
      return ['tarjeta', 'bizum', 'pendiente'];
  }
}

/**
 * Resolve the user type from auth state.
 * - No user = guest
 * - Professional grupo_cliente = profesional
 * - Everything else (particular, null) = particular
 */
export function resolveUserType(user: { grupo_cliente: string | null } | null): UserType {
  if (!user) return 'guest';
  if (isProfessionalUser(user)) return 'profesional';
  return 'particular';
}

// ─── IVA breakdown computation ───

export interface IvaGroup {
  rate: number;          // 21, 10, or 4
  baseImponible: number; // sum of item subtotals at this rate (sin IVA)
  ivaAmount: number;     // baseImponible * rate / 100
}

export interface CheckoutSummary {
  subtotalSinIva: number;
  ivaGroups: IvaGroup[];
  totalIva: number;
  shipping: number;
  shippingIva: number;     // shipping * 0.21 (transport services at 21%)
  total: number;           // subtotalSinIva + totalIva + shipping + shippingIva
}

/**
 * Compute IVA breakdown by grouping items by tipo_iva rate.
 * Returns groups sorted by rate descending (21%, 10%, 4%).
 * Uses consistent rounding: Math.round(x * 100) / 100 at each group level.
 */
export function computeIvaBreakdown(items: { precioUnitario: number; cantidad: number; tipoIva: number }[]): IvaGroup[] {
  const groups = new Map<number, number>();
  for (const item of items) {
    const rate = item.tipoIva || 21;
    const base = item.precioUnitario * item.cantidad;
    groups.set(rate, (groups.get(rate) || 0) + base);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b - a)
    .map(([rate, baseImponible]) => ({
      rate,
      baseImponible: Math.round(baseImponible * 100) / 100,
      ivaAmount: Math.round(baseImponible * rate / 100 * 100) / 100,
    }));
}

/**
 * Compute full checkout summary with IVA for B2C users.
 * For B2B users, call with isB2C=false to skip IVA computation.
 * Shipping IVA: 21% standard rate for transport services in Spain.
 * Shipping IVA-inclusive display: 15 * 1.21 = 18.15 EUR.
 */
export function computeCheckoutSummary(
  items: { precioUnitario: number; cantidad: number; tipoIva: number }[],
  isB2C: boolean
): CheckoutSummary {
  const subtotalSinIva = Math.round(
    items.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0) * 100
  ) / 100;

  const shipping = calculateShipping(subtotalSinIva);

  if (!isB2C) {
    // B2B: no IVA computation (existing behavior)
    return {
      subtotalSinIva,
      ivaGroups: [],
      totalIva: 0,
      shipping,
      shippingIva: 0,
      total: Math.round((subtotalSinIva + shipping) * 100) / 100,
    };
  }

  const ivaGroups = computeIvaBreakdown(items);
  const totalIva = Math.round(
    ivaGroups.reduce((sum, g) => sum + g.ivaAmount, 0) * 100
  ) / 100;
  const shippingIva = shipping > 0 ? Math.round(shipping * 0.21 * 100) / 100 : 0;
  const total = Math.round((subtotalSinIva + totalIva + shipping + shippingIva) * 100) / 100;

  return { subtotalSinIva, ivaGroups, totalIva, shipping, shippingIva, total };
}
