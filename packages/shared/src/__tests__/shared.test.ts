import { describe, expect, it } from "vitest";
import {
  areUnitsCompatible,
  calculateComponentCostPaise,
  calculateGstAndTotals,
  calculateRecipeMetrics,
  canTransitionOrderStatus,
  convertUnitQuantity,
  formatINR,
  hasPermission,
  paiseToRupees,
  rupeesToPaise,
} from "../index";

describe("@dinepilot/shared core business logic", () => {
  it("converts between rupees and integer paise and formats INR cleanly", () => {
    expect(rupeesToPaise(245.5)).toBe(24550);
    expect(paiseToRupees(24550)).toBe(245.5);
    expect(formatINR(12500000)).toContain("1,25,000");
  });

  it("calculates Indian GST (2.5% CGST + 2.5% SGST) and ₹1 round-off accurately in TAX_EXCLUSIVE mode", () => {
    const result = calculateGstAndTotals({
      itemsSubtotalPaise: 46500,
      discountPaise: 0,
      orderType: "DINE_IN",
      taxConfig: {
        taxMode: "TAX_EXCLUSIVE",
        cgstRateBps: 250,
        sgstRateBps: 250,
        serviceChargeRateBps: 0,
        enableRoundOff: true,
      },
    });
    expect(result.cgstPaise).toBe(1163);
    expect(result.sgstPaise).toBe(1163);
    expect(result.preRoundTotalPaise).toBe(48826);
    expect(result.roundOffPaise).toBe(-26);
    expect(result.totalPaise).toBe(48800);
  });

  it("supports COMPOSITION_OR_EXEMPT and TAX_INCLUSIVE modes accurately", () => {
    const comp = calculateGstAndTotals({
      itemsSubtotalPaise: 30000,
      orderType: "TAKEAWAY",
      packagingTotalPaise: 2000,
      taxConfig: {
        taxMode: "COMPOSITION_OR_EXEMPT",
        cgstRateBps: 250,
        sgstRateBps: 250,
        serviceChargeRateBps: 500,
        enableRoundOff: true,
      },
    });
    expect(comp.cgstPaise).toBe(0);
    expect(comp.sgstPaise).toBe(0);
    expect(comp.serviceChargePaise).toBe(0);
    expect(comp.packagingTotalPaise).toBe(2000);
    expect(comp.totalPaise).toBe(32000);

    const inclusive = calculateGstAndTotals({
      itemsSubtotalPaise: 21000,
      orderType: "DINE_IN",
      taxConfig: {
        taxMode: "TAX_INCLUSIVE",
        cgstRateBps: 250,
        sgstRateBps: 250,
        serviceChargeRateBps: 0,
        enableRoundOff: false,
      },
    });
    expect(inclusive.totalPaise).toBe(21000);
    expect(inclusive.totalTaxPaise).toBe(1000);
    expect(inclusive.cgstPaise).toBe(500);
    expect(inclusive.sgstPaise).toBe(500);
  });

  it("validates unit conversions and rejects incompatible unit families", () => {
    expect(areUnitsCompatible("g", "kg")).toBe(true);
    expect(areUnitsCompatible("ml", "l")).toBe(true);
    expect(areUnitsCompatible("g", "ml")).toBe(false);
    expect(convertUnitQuantity(250, "g", "kg")).toBe(0.25);
    expect(() => convertUnitQuantity(100, "g", "ml")).toThrow(
      /INVALID_UNIT_CONVERSION/
    );
  });

  it("calculates yield-adjusted recipe component cost and gross margins", () => {
    const comp = calculateComponentCostPaise({
      quantity: 200,
      recipeUnit: "g",
      ingredientStockUnit: "kg",
      ingredientCostPerStockUnitPaise: 4000,
      usableYieldPercent: 80,
    });
    expect(comp.quantityInStockUnit).toBe(0.2);
    expect(comp.rawCostPaise).toBe(800);
    expect(comp.yieldAdjustedCostPaise).toBe(1000);

    const metrics = calculateRecipeMetrics({
      sellingPricePaise: 30000,
      ingredientCostPerServingPaise: 9000,
      packagingCostPaise: 1500,
    });
    expect(metrics.foodCostPercentage).toBe(30);
    expect(metrics.estimatedGrossProfitPaise).toBe(19500);
    expect(metrics.grossMarginPercentage).toBe(65);
  });

  it("enforces order state machine transitions and RBAC permissions", () => {
    expect(canTransitionOrderStatus("NEW", "ACCEPTED")).toBe(true);
    expect(canTransitionOrderStatus("NEW", "COMPLETED")).toBe(false);
    expect(canTransitionOrderStatus("COMPLETED", "PREPARING")).toBe(false);
    expect(hasPermission("OWNER", "settings:write")).toBe(true);
    expect(hasPermission("KITCHEN", "settings:write")).toBe(false);
    expect(hasPermission("KITCHEN", "kitchen:access")).toBe(true);
  });
});
