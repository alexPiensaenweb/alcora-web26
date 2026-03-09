import { describe, it, expect } from "vitest";
import {
  calculateB2CPrice,
  isProfessionalUser,
  resolveDiscount,
  calculatePrice,
  formatCurrency,
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
