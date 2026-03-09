import { describe, it, expect } from "vitest";
import {
  calculateB2CPrice,
  isProfessionalUser,
  resolveDiscount,
  calculatePrice,
  formatCurrency,
  getAllowedPaymentMethods,
  computeIvaBreakdown,
  computeCheckoutSummary,
  resolveUserType,
} from "./pricing";

// Existing functions — regression guard
describe("resolveDiscount (existing)", () => {
  it("returns 0 when no tarifas match", () => {
    expect(resolveDiscount([], "p1", null)).toBe(0);
  });
});

describe("calculatePrice (existing)", () => {
  it("applies discount correctly", () => {
    expect(calculatePrice(100, 10)).toBe(90);
  });
});

describe("formatCurrency (existing)", () => {
  it("formats euros", () => {
    const result = formatCurrency(121);
    expect(result).toContain("121");
  });
});

// New functions
describe("calculateB2CPrice", () => {
  it("applies 21% IVA correctly", () => {
    expect(calculateB2CPrice(100, 21)).toBe(121.0);
  });

  it("applies 10% IVA correctly", () => {
    expect(calculateB2CPrice(100, 10)).toBe(110.0);
  });

  it("applies 4% IVA correctly", () => {
    expect(calculateB2CPrice(100, 4)).toBe(104.0);
  });

  it("rounds to 2 decimal places", () => {
    expect(calculateB2CPrice(9.99, 21)).toBe(12.09);
  });

  it("returns 0 for zero price", () => {
    expect(calculateB2CPrice(0, 21)).toBe(0);
  });
});

describe("isProfessionalUser", () => {
  it("returns false for null user", () => {
    expect(isProfessionalUser(null)).toBe(false);
  });

  it("returns false for user with null grupo_cliente", () => {
    expect(isProfessionalUser({ grupo_cliente: null })).toBe(false);
  });

  it("returns false for particulares", () => {
    expect(isProfessionalUser({ grupo_cliente: "particular" })).toBe(false);
  });

  it("returns true for empresa", () => {
    expect(isProfessionalUser({ grupo_cliente: "empresa" })).toBe(true);
  });

  it("returns true for distribuidor", () => {
    expect(isProfessionalUser({ grupo_cliente: "distribuidor" })).toBe(true);
  });

  it("returns true for hospital", () => {
    expect(isProfessionalUser({ grupo_cliente: "hospital" })).toBe(true);
  });
});

// ─── New Phase 4 functions ───

describe("getAllowedPaymentMethods", () => {
  it("returns tarjeta and bizum for guest", () => {
    expect(getAllowedPaymentMethods("guest")).toEqual(["tarjeta", "bizum"]);
  });

  it("returns tarjeta and bizum for particular", () => {
    expect(getAllowedPaymentMethods("particular")).toEqual(["tarjeta", "bizum"]);
  });

  it("returns tarjeta, bizum, and pendiente for profesional", () => {
    expect(getAllowedPaymentMethods("profesional")).toEqual(["tarjeta", "bizum", "pendiente"]);
  });
});

describe("resolveUserType", () => {
  it("returns guest for null user", () => {
    expect(resolveUserType(null)).toBe("guest");
  });

  it("returns particular for user with null grupo_cliente", () => {
    expect(resolveUserType({ grupo_cliente: null })).toBe("particular");
  });

  it("returns particular for particulares", () => {
    expect(resolveUserType({ grupo_cliente: "particular" })).toBe("particular");
  });

  it("returns profesional for empresa", () => {
    expect(resolveUserType({ grupo_cliente: "empresa" })).toBe("profesional");
  });

  it("returns profesional for distribuidor", () => {
    expect(resolveUserType({ grupo_cliente: "distribuidor" })).toBe("profesional");
  });
});

describe("computeIvaBreakdown", () => {
  it("computes single 21% item correctly", () => {
    const result = computeIvaBreakdown([
      { precioUnitario: 100, cantidad: 1, tipoIva: 21 },
    ]);
    expect(result).toEqual([
      { rate: 21, baseImponible: 100, ivaAmount: 21 },
    ]);
  });

  it("computes mixed 21% and 10% items, sorted by rate desc", () => {
    const result = computeIvaBreakdown([
      { precioUnitario: 50, cantidad: 2, tipoIva: 10 },
      { precioUnitario: 100, cantidad: 1, tipoIva: 21 },
    ]);
    expect(result).toEqual([
      { rate: 21, baseImponible: 100, ivaAmount: 21 },
      { rate: 10, baseImponible: 100, ivaAmount: 10 },
    ]);
  });

  it("returns empty array for empty items", () => {
    expect(computeIvaBreakdown([])).toEqual([]);
  });

  it("handles rounding correctly (no floating-point errors)", () => {
    // 9.99 * 3 = 29.97 base, 29.97 * 0.21 = 6.2937 -> 6.29
    const result = computeIvaBreakdown([
      { precioUnitario: 9.99, cantidad: 3, tipoIva: 21 },
    ]);
    expect(result).toEqual([
      { rate: 21, baseImponible: 29.97, ivaAmount: 6.29 },
    ]);
  });

  it("groups multiple items at same IVA rate", () => {
    const result = computeIvaBreakdown([
      { precioUnitario: 10, cantidad: 2, tipoIva: 21 },
      { precioUnitario: 20, cantidad: 1, tipoIva: 21 },
    ]);
    expect(result).toEqual([
      { rate: 21, baseImponible: 40, ivaAmount: 8.4 },
    ]);
  });
});

describe("computeCheckoutSummary", () => {
  it("computes B2C summary with IVA and shipping IVA", () => {
    const result = computeCheckoutSummary(
      [{ precioUnitario: 100, cantidad: 1, tipoIva: 21 }],
      true
    );
    expect(result.subtotalSinIva).toBe(100);
    expect(result.ivaGroups).toEqual([{ rate: 21, baseImponible: 100, ivaAmount: 21 }]);
    expect(result.totalIva).toBe(21);
    expect(result.shipping).toBe(15);
    expect(result.shippingIva).toBe(3.15);
    expect(result.total).toBe(139.15);
  });

  it("computes B2B summary without IVA", () => {
    const result = computeCheckoutSummary(
      [{ precioUnitario: 100, cantidad: 1, tipoIva: 21 }],
      false
    );
    expect(result.subtotalSinIva).toBe(100);
    expect(result.ivaGroups).toEqual([]);
    expect(result.totalIva).toBe(0);
    expect(result.shipping).toBe(15);
    expect(result.shippingIva).toBe(0);
    expect(result.total).toBe(115);
  });

  it("applies free shipping for B2C above threshold", () => {
    const result = computeCheckoutSummary(
      [{ precioUnitario: 500, cantidad: 1, tipoIva: 21 }],
      true
    );
    expect(result.shipping).toBe(0);
    expect(result.shippingIva).toBe(0);
    expect(result.total).toBe(605); // 500 + 105 IVA
  });
});
