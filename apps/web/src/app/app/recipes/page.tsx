"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Scale, Info } from "lucide-react";
import { formatINR, MeasurementUnit } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/AppProviders";

export default function RecipesCostingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [yieldServings, setYieldServings] = useState("1");
  const [prepInstructions, setPrepInstructions] = useState("");
  const [components, setComponents] = useState<
    Array<{ ingredientId: string; quantity: string; unit: MeasurementUnit }>
  >([]);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => apiFetch("/recipes"),
  });

  const { data: menuData } = useQuery({
    queryKey: ["menu"],
    queryFn: () => apiFetch("/menu"),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["inventory", "ingredients"],
    queryFn: () => apiFetch("/inventory/ingredients"),
  });

  function openBuilderModal() {
    const firstItem = menuData?.items?.[0];
    const firstIng = ingredients[0];
    setSelectedMenuItemId(firstItem?._id || "");
    setYieldServings("1");
    setPrepInstructions("");
    setComponents(
      firstIng
        ? [
            {
              ingredientId: firstIng._id,
              quantity: "150",
              unit: firstIng.unit === "kg" ? "g" : firstIng.unit === "l" ? "ml" : "pcs",
            },
          ]
        : []
    );
    setModalOpen(true);
  }

  async function handleSaveRecipe(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/recipes", {
        method: "POST",
        body: JSON.stringify({
          menuItemId: selectedMenuItemId,
          yieldServings: Number(yieldServings) || 1,
          prepInstructions,
          components: components.map((c) => ({
            ingredientId: c.ingredientId,
            quantity: Number(c.quantity),
            unit: c.unit,
          })),
        }),
      });
      toast({
        title: "Recipe costing saved",
        description: "Yield-adjusted serving cost and food cost % updated.",
        variant: "success",
      });
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["profitability"] });
    } catch (err: any) {
      toast({
        title: "Recipe validation error",
        description: err?.message,
        variant: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F291E]">
            Recipe Costing & Yield Economics
          </h2>
          <p className="text-xs text-[#4A5950]">
            Calculate ingredient cost per serving, usable yield loss, food cost
            %, and estimated gross profit
          </p>
        </div>

        <button
          type="button"
          onClick={openBuilderModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F291E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#163829]"
        >
          <Plus className="h-4 w-4 text-[#84CC16]" />
          Configure Dish Recipe
        </button>
      </div>

      <div className="rounded-2xl border border-[#0F291E]/15 bg-[#E6ECE8]/70 p-4 flex items-start gap-3 text-xs text-[#0F291E]">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#D97706]" />
        <div className="space-y-1">
          <p className="font-semibold">
            Accounting & Yield Formula Documentation:
          </p>
          <p className="text-[#4A5950]">
            <strong>Food Cost %</strong> = (Yield-Adjusted Ingredient Cost per
            Serving ÷ Menu Selling Price) × 100.{" "}
            <strong>Estimated Gross Profit per Serving</strong> = Menu Selling
            Price − (Yield-Adjusted Ingredient Cost + Packaging Cost). Note:
            Gross profit is never labeled as net profit (which deducts rent,
            labor, and utilities).
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-white border border-[#E5E0D5] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {recipes.map((recipe: any) => (
            <div
              key={recipe.id}
              className="rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-card space-y-4"
            >
              <div className="flex items-start justify-between border-b border-[#E5E0D5] pb-3.5">
                <div>
                  <span className="rounded bg-[#E6ECE8] px-2 py-0.5 text-[10px] font-bold text-[#0F291E]">
                    {recipe.dietaryType} • Yield: {recipe.yieldServings} Serving(s)
                  </span>
                  <h3 className="font-display font-bold text-lg text-[#0F291E] mt-1">
                    {recipe.menuItemName}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#718077] uppercase block">
                    Menu Selling Price
                  </span>
                  <span className="font-mono font-bold text-base text-[#0F291E]">
                    {formatINR(recipe.sellingPricePaise)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="rounded-xl bg-[#FBF9F5] border border-[#E5E0D5] p-3">
                  <span className="text-[#718077] block text-[11px]">
                    Ingredient Cost
                  </span>
                  <span className="font-mono font-bold text-sm text-[#111C16]">
                    {formatINR(recipe.ingredientCostPerServingPaise)}
                  </span>
                </div>
                <div className="rounded-xl bg-[#FBF9F5] border border-[#E5E0D5] p-3">
                  <span className="text-[#718077] block text-[11px]">
                    Food Cost %
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      recipe.foodCostPercentage > 38
                        ? "text-amber-700"
                        : "text-[#0F291E]"
                    }`}
                  >
                    {recipe.foodCostPercentage}%
                  </span>
                </div>
                <div className="rounded-xl bg-[#FBF9F5] border border-[#E5E0D5] p-3">
                  <span className="text-[#718077] block text-[11px]">
                    Est. Gross Profit
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-700">
                    {formatINR(recipe.estimatedGrossProfitPaise)} (
                    {recipe.grossMarginPercentage}%)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#718077]">
                  Ingredient Components (Per Batch)
                </p>
                {recipe.components.map((c: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs rounded-lg bg-[#FBF9F5] px-3 py-1.5 border border-[#E5E0D5]/60"
                  >
                    <span>
                      <strong className="text-[#0F291E]">
                        {c.ingredientName}
                      </strong>{" "}
                      — {c.quantity} {c.unit}{" "}
                      {c.usableYieldPercent < 100 && (
                        <span className="text-[10px] text-amber-800">
                          ({c.usableYieldPercent}% yield)
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-semibold text-[#111C16]">
                      {formatINR(c.yieldAdjustedCostPaise)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-[#E5E0D5] p-6 shadow-editorial space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0F291E]">
              Configure Dish Recipe & Costing
            </h3>
            <form onSubmit={handleSaveRecipe} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1">
                    Menu Item *
                  </label>
                  <select
                    value={selectedMenuItemId}
                    onChange={(e) => setSelectedMenuItemId(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                  >
                    {(menuData?.items || []).map((item: any) => (
                      <option key={item._id} value={item._id}>
                        {item.name} ({formatINR(item.pricePaise)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Yield Servings
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={yieldServings}
                    onChange={(e) => setYieldServings(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0F291E]">
                    Ingredients & Quantities
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setComponents((prev) => [
                        ...prev,
                        {
                          ingredientId: ingredients[0]?._id || "",
                          quantity: "50",
                          unit: "g",
                        },
                      ])
                    }
                    className="text-xs font-semibold text-[#286249] hover:underline"
                  >
                    + Add Ingredient Line
                  </button>
                </div>

                {components.map((comp, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <select
                      value={comp.ingredientId}
                      onChange={(e) =>
                        setComponents((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, ingredientId: e.target.value }
                              : item
                          )
                        )
                      }
                      className="col-span-6 rounded-lg border border-[#E5E0D5] px-2.5 py-2 text-xs"
                    >
                      {ingredients.map((ing: any) => (
                        <option key={ing._id} value={ing._id}>
                          {ing.name} (Stock unit: {ing.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={comp.quantity}
                      onChange={(e) =>
                        setComponents((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, quantity: e.target.value }
                              : item
                          )
                        )
                      }
                      className="col-span-3 rounded-lg border border-[#E5E0D5] px-2.5 py-2 text-xs font-mono"
                    />
                    <select
                      value={comp.unit}
                      onChange={(e) =>
                        setComponents((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  unit: e.target.value as MeasurementUnit,
                                }
                              : item
                          )
                        )
                      }
                      className="col-span-2 rounded-lg border border-[#E5E0D5] px-2 py-2 text-xs"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="pcs">pcs</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setComponents((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="col-span-1 text-red-600 font-bold text-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Chef Preparation Notes
                </label>
                <input
                  value={prepInstructions}
                  onChange={(e) => setPrepInstructions(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#E5E0D5] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F291E] px-5 py-2 text-xs font-semibold text-white"
                >
                  Save Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
