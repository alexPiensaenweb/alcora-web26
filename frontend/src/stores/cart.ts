/**
 * Cart Store - Nano Stores with localStorage persistence
 *
 * Client-side cart management shared across all React islands.
 * Uses persistentAtom with JSON encode/decode for CartItem objects.
 */

import { computed } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import type { CartItem } from "../lib/types";
import { calculateShipping } from "../lib/shipping";

// Persistent cart: JSON-encoded array stored in localStorage
export const $cartItems = persistentAtom<CartItem[]>(
  "alcora-cart",
  [],
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export function addToCart(item: CartItem): void {
  const current = $cartItems.get();
  const idx = current.findIndex((i) => i.productoId === item.productoId);

  if (idx >= 0) {
    const updated = [...current];
    updated[idx] = {
      ...updated[idx],
      cantidad: updated[idx].cantidad + item.cantidad,
    };
    $cartItems.set(updated);
  } else {
    $cartItems.set([...current, item]);
  }
}

export function removeFromCart(productoId: string): void {
  $cartItems.set($cartItems.get().filter((i) => i.productoId !== productoId));
}

export function updateQuantity(productoId: string, cantidad: number): void {
  if (cantidad <= 0) {
    removeFromCart(productoId);
    return;
  }
  const current = $cartItems.get();
  $cartItems.set(
    current.map((i) =>
      i.productoId === productoId ? { ...i, cantidad } : i
    )
  );
}

export function clearCart(): void {
  $cartItems.set([]);
}

// ─── Computed values ───

export const $cartList = computed($cartItems, (items) => items);

export const $cartCount = computed($cartItems, (items) =>
  items.reduce((sum, item) => sum + item.cantidad, 0)
);

export const $cartSubtotal = computed($cartItems, (items) =>
  items.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0)
);

export const $shippingCost = computed($cartSubtotal, (subtotal) =>
  calculateShipping(subtotal)
);

export const $cartTotal = computed(
  [$cartSubtotal, $shippingCost],
  (subtotal, shipping) => subtotal + shipping
);
