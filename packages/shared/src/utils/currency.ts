import { OrderType, TaxMode } from "../constants";

export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return Math.round(paise) / 100;
}

export function formatINR(
  paise: number,
  options: { showDecimals?: boolean; compact?: boolean } = {}
): string {
  const safePaise = Number.isFinite(paise) ? Math.round(paise) : 0;
  const rupees = safePaise / 100;
  const hasFraction = safePaise % 100 !== 0;
  const showDecimals = options.showDecimals ?? hasFraction;

  if (options.compact && Math.abs(rupees) >= 100000) {
    if (Math.abs(rupees) >= 10000000) {
      return `₹${(rupees / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(rupees / 100000).toFixed(2)} L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);
}

export interface OrderPricingInput {
  itemsSubtotalPaise: number;
  discountPaise?: number;
  packagingTotalPaise?: number;
  orderType: OrderType;
  taxConfig: {
    taxMode: TaxMode;
    cgstRateBps: number;
    sgstRateBps: number;
    serviceChargeRateBps: number;
    defaultPackagingPaise?: number;
    enableRoundOff: boolean;
  };
}

export interface OrderPricingBreakdown {
  subtotalPaise: number;
  discountPaise: number;
  netItemsSubtotalPaise: number;
  serviceChargePaise: number;
  packagingTotalPaise: number;
  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  totalTaxPaise: number;
  preRoundTotalPaise: number;
  roundOffPaise: number;
  totalPaise: number;
  taxMode: TaxMode;
}

export function calculateGstAndTotals(
  input: OrderPricingInput
): OrderPricingBreakdown {
  const subtotalPaise = Math.max(0, Math.round(input.itemsSubtotalPaise));
  const discountPaise = Math.min(
    subtotalPaise,
    Math.max(0, Math.round(input.discountPaise ?? 0))
  );
  const netItemsSubtotalPaise = subtotalPaise - discountPaise;

  const serviceChargeRateBps =
    input.orderType === "DINE_IN"
      ? Math.max(0, Math.round(input.taxConfig.serviceChargeRateBps || 0))
      : 0;

  const serviceChargePaise = Math.round(
    (netItemsSubtotalPaise * serviceChargeRateBps) / 10000
  );

  const packagingTotalPaise =
    input.orderType === "TAKEAWAY" || input.orderType === "DELIVERY"
      ? Math.max(
          0,
          Math.round(
            input.packagingTotalPaise ??
              input.taxConfig.defaultPackagingPaise ??
              0
          )
        )
      : 0;

  const taxableAmountPaise =
    netItemsSubtotalPaise + serviceChargePaise + packagingTotalPaise;

  const cgstBps = Math.max(0, Math.round(input.taxConfig.cgstRateBps || 0));
  const sgstBps = Math.max(0, Math.round(input.taxConfig.sgstRateBps || 0));
  const combinedTaxBps = cgstBps + sgstBps;

  let cgstPaise = 0;
  let sgstPaise = 0;
  let preRoundTotalPaise = taxableAmountPaise;

  if (input.taxConfig.taxMode === "TAX_EXCLUSIVE") {
    cgstPaise = Math.round((taxableAmountPaise * cgstBps) / 10000);
    sgstPaise = Math.round((taxableAmountPaise * sgstBps) / 10000);
    preRoundTotalPaise = taxableAmountPaise + cgstPaise + sgstPaise;
  } else if (input.taxConfig.taxMode === "TAX_INCLUSIVE") {
    if (combinedTaxBps > 0) {
      const totalIncludedTax = Math.round(
        (taxableAmountPaise * combinedTaxBps) / (10000 + combinedTaxBps)
      );
      cgstPaise = Math.round((totalIncludedTax * cgstBps) / combinedTaxBps);
      sgstPaise = totalIncludedTax - cgstPaise;
    }
    preRoundTotalPaise = taxableAmountPaise;
  } else {
    cgstPaise = 0;
    sgstPaise = 0;
    preRoundTotalPaise = taxableAmountPaise;
  }

  let roundOffPaise = 0;
  let totalPaise = preRoundTotalPaise;

  if (input.taxConfig.enableRoundOff && preRoundTotalPaise > 0) {
    const nearestRupeePaise = Math.round(preRoundTotalPaise / 100) * 100;
    roundOffPaise = nearestRupeePaise - preRoundTotalPaise;
    totalPaise = nearestRupeePaise;
  }

  return {
    subtotalPaise,
    discountPaise,
    netItemsSubtotalPaise,
    serviceChargePaise,
    packagingTotalPaise,
    taxableAmountPaise,
    cgstPaise,
    sgstPaise,
    totalTaxPaise: cgstPaise + sgstPaise,
    preRoundTotalPaise,
    roundOffPaise,
    totalPaise,
    taxMode: input.taxConfig.taxMode,
  };
}
