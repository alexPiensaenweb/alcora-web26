/**
 * Pricing Engine - Calcula precios con descuentos por grupo de cliente
 *
 * Prioridad de descuento:
 * 1. Tarifa especifica para el producto
 * 2. Tarifa por categoria del producto
 * 3. Tarifa global del grupo (producto y categoria = null)
 */

import type { TarifaEspecial } from "./types";

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
