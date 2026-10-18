import { MeasurementUnit } from "../constants";

type UnitFamily = "MASS" | "VOLUME" | "COUNT";

const UNIT_FAMILY_MAP: Record<MeasurementUnit, UnitFamily> = {
  g: "MASS",
  kg: "MASS",
  ml: "VOLUME",
  l: "VOLUME",
  pcs: "COUNT",
};

const UNIT_TO_BASE_MULTIPLIER: Record<MeasurementUnit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  pcs: 1,
};

export function getUnitFamily(unit: MeasurementUnit): UnitFamily {
  return UNIT_FAMILY_MAP[unit];
}

export function areUnitsCompatible(
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit
): boolean {
  return UNIT_FAMILY_MAP[fromUnit] === UNIT_FAMILY_MAP[toUnit];
}

export function convertUnitQuantity(
  quantity: number,
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit
): number {
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    throw new Error(
      `INVALID_UNIT_CONVERSION: Cannot convert ${fromUnit} (${getUnitFamily(
        fromUnit
      )}) to ${toUnit} (${getUnitFamily(toUnit)})`
    );
  }
  if (fromUnit === toUnit) return quantity;
  const baseQty = quantity * UNIT_TO_BASE_MULTIPLIER[fromUnit];
  return baseQty / UNIT_TO_BASE_MULTIPLIER[toUnit];
}

export interface RecipeComponentCostInput {
  quantity: number;
  recipeUnit: MeasurementUnit;
  ingredientStockUnit: MeasurementUnit;
  ingredientCostPerStockUnitPaise: number;
  usableYieldPercent?: number;
}

export function calculateComponentCostPaise(
  input: RecipeComponentCostInput
): {
  quantityInStockUnit: number;
  rawCostPaise: number;
  yieldAdjustedCostPaise: number;
} {
  const quantityInStockUnit = convertUnitQuantity(
    input.quantity,
    input.recipeUnit,
    input.ingredientStockUnit
  );

  const rawCostPaise =
    quantityInStockUnit * Math.max(0, input.ingredientCostPerStockUnitPaise);
  const safeYield = Math.min(
    100,
    Math.max(1, input.usableYieldPercent ?? 100)
  );
  const yieldAdjustedCostPaise = Math.round(rawCostPaise / (safeYield / 100));

  return {
    quantityInStockUnit,
    rawCostPaise: Math.round(rawCostPaise),
    yieldAdjustedCostPaise,
  };
}

export interface RecipeProfitabilityMetrics {
  sellingPricePaise: number;
  ingredientCostPerServingPaise: number;
  packagingCostPaise: number;
  totalDirectCostPaise: number;
  estimatedGrossProfitPaise: number;
  foodCostPercentage: number;
  grossMarginPercentage: number;
}

export function calculateRecipeMetrics(params: {
  sellingPricePaise: number;
  ingredientCostPerServingPaise: number;
  packagingCostPaise?: number;
}): RecipeProfitabilityMetrics {
  const sellingPricePaise = Math.max(0, Math.round(params.sellingPricePaise));
  const ingredientCostPerServingPaise = Math.max(
    0,
    Math.round(params.ingredientCostPerServingPaise)
  );
  const packagingCostPaise = Math.max(
    0,
    Math.round(params.packagingCostPaise ?? 0)
  );
  const totalDirectCostPaise =
    ingredientCostPerServingPaise + packagingCostPaise;
  const estimatedGrossProfitPaise = sellingPricePaise - totalDirectCostPaise;

  const foodCostPercentage =
    sellingPricePaise > 0
      ? Number(
          ((ingredientCostPerServingPaise / sellingPricePaise) * 100).toFixed(2)
        )
      : 0;

  const grossMarginPercentage =
    sellingPricePaise > 0
      ? Number(
          ((estimatedGrossProfitPaise / sellingPricePaise) * 100).toFixed(2)
        )
      : 0;

  return {
    sellingPricePaise,
    ingredientCostPerServingPaise,
    packagingCostPaise,
    totalDirectCostPaise,
    estimatedGrossProfitPaise,
    foodCostPercentage,
    grossMarginPercentage,
  };
}
