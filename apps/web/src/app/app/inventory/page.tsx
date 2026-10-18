"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ArrowUpDown,
  AlertTriangle,
  Trash2,
  History,
  Boxes,
} from "lucide-react";
import {
  formatINR,
  InventoryMovementType,
  MeasurementUnit,
  rupeesToPaise,
} from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/AppProviders";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "ingredients" | "movements" | "waste"
  >("ingredients");
  const [ingModalOpen, setIngModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  const [ingName, setIngName] = useState("");
  const [ingCategory, setIngCategory] = useState("Produce");
  const [ingUnit, setIngUnit] = useState<MeasurementUnit>("kg");
  const [ingStock, setIngStock] = useState("10");
  const [ingReorder, setIngReorder] = useState("5");
  const [ingCostRupees, setIngCostRupees] = useState("120");
  const [ingYield, setIngYield] = useState("90");

  const [moveIngId, setMoveIngId] = useState("");
  const [moveType, setMoveType] =
    useState<InventoryMovementType>("PURCHASE_RECEIVED");
  const [moveQty, setMoveQty] = useState("5");
  const [moveReason, setMoveReason] = useState("");

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ["inventory", "ingredients"],
    queryFn: () => apiFetch("/inventory/ingredients"),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["inventory", "movements"],
    queryFn: () => apiFetch("/inventory/movements"),
  });

  const { data: wasteReport } = useQuery({
    queryKey: ["inventory", "waste"],
    queryFn: () => apiFetch("/inventory/waste-report"),
  });

  async function handleCreateIngredient(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/inventory/ingredients", {
        method: "POST",
        body: JSON.stringify({
          name: ingName,
          category: ingCategory,
          unit: ingUnit,
          currentStock: Number(ingStock) || 0,
          reorderThreshold: Number(ingReorder) || 5,
          costPerUnitPaise: rupeesToPaise(Number(ingCostRupees) || 0),
          usableYieldPercent: Number(ingYield) || 100,
        }),
      });
      toast({ title: `Added ingredient '${ingName}'`, variant: "success" });
      setIngName("");
      setIngModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    } catch (err: any) {
      toast({
        title: "Failed to add ingredient",
        description: err?.message,
        variant: "error",
      });
    }
  }

  async function handleRecordMovement(e: React.FormEvent) {
    e.preventDefault();
    try {
      const targetId = moveIngId || ingredients[0]?._id;
      await apiFetch("/inventory/movements", {
        method: "POST",
        body: JSON.stringify({
          ingredientId: targetId,
          type: moveType,
          quantity: Number(moveQty),
          reason: moveReason || `${moveType} logged by staff`,
          idempotencyKey: `move-${Date.now()}`,
        }),
      });
      toast({
        title: `Recorded ${moveType} movement`,
        description: "Auditable stock ledger updated.",
        variant: "success",
      });
      setMoveReason("");
      setMoveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-alerts"] });
    } catch (err: any) {
      toast({
        title: "Stock movement rejected",
        description: err?.message,
        variant: "error",
      });
    }
  }

  const totalInventoryValuePaise = ingredients.reduce(
    (s: number, i: any) => s + (i.stockValuePaise || 0),
    0
  );
  const lowStockCount = ingredients.filter((i: any) => i.isLowStock).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#101820]">
            Ingredient Inventory & Waste Intelligence
          </h2>
          <p className="text-xs text-[#64748B]">
            Auditable movement ledger, usable yield costing, and spoilage
            analytics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (ingredients[0] && !moveIngId) setMoveIngId(ingredients[0]._id);
              setMoveModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#176B52] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#101820] hover:bg-[#F1EFE9]"
          >
            <ArrowUpDown className="h-4 w-4 text-[#C6A15B]" />
            Record Stock Movement
          </button>
          <button
            type="button"
            onClick={() => setIngModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541]"
          >
            <Plus className="h-4 w-4 text-[#20A67A]" />
            Add Ingredient
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <span className="text-xs text-[#64748B] font-semibold">
            On-Hand Stock Valuation
          </span>
          <p className="font-mono text-2xl font-bold text-[#101820] mt-1">
            {formatINR(totalInventoryValuePaise)}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Across {ingredients.length} tracked ingredients
          </p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <span className="text-xs text-[#64748B] font-semibold">
            Low-Stock Reorder Alerts
          </span>
          <p className="font-mono text-2xl font-bold text-amber-700 mt-1">
            {lowStockCount} Ingredient(s)
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            At or below safety reorder threshold
          </p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <span className="text-xs text-[#64748B] font-semibold">
            Measured Waste & Spoilage Cost
          </span>
          <p className="font-mono text-2xl font-bold text-red-700 mt-1">
            {formatINR(wasteReport?.totalWasteCostPaise || 0)}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            {wasteReport?.totalWasteEvents || 0} auditable waste/spoilage logs
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
        {[
          { id: "ingredients", label: "Ingredients & Yield", icon: Boxes },
          { id: "movements", label: "Auditable Movement Ledger", icon: History },
          { id: "waste", label: "Waste & Spoilage Intelligence", icon: Trash2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-[#176B52] text-white"
                  : "text-[#64748B] hover:bg-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "ingredients" && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-x-auto shadow-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F7F3] text-[#64748B]">
                <th className="py-3.5 px-4 font-semibold">Ingredient</th>
                <th className="py-3.5 px-4 font-semibold">On-Hand Stock</th>
                <th className="py-3.5 px-4 font-semibold">Reorder Threshold</th>
                <th className="py-3.5 px-4 font-semibold">Purchase Cost</th>
                <th className="py-3.5 px-4 font-semibold">Usable Yield %</th>
                <th className="py-3.5 px-4 font-semibold">
                  Effective Yield Cost
                </th>
                <th className="py-3.5 px-4 font-semibold">Supplier</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#64748B]">
                    Loading ingredients...
                  </td>
                </tr>
              ) : (
                ingredients.map((ing: any) => (
                  <tr key={ing._id} className="hover:bg-[#F8F7F3]/60">
                    <td className="py-3.5 px-4 font-semibold text-[#101820]">
                      {ing.name}
                      <span className="block text-[10px] font-normal text-[#64748B]">
                        {ing.category} • {ing.storageNotes || "Standard store"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#101820]">
                      {ing.currentStock} {ing.unit}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#64748B]">
                      {ing.reorderThreshold} {ing.unit}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {formatINR(ing.costPerUnitPaise)}/{ing.unit}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {ing.usableYieldPercent}%
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#101820]">
                      {formatINR(ing.effectiveCostPerUnitPaise)}/{ing.unit}
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">
                      {ing.supplierName}
                    </td>
                    <td className="py-3.5 px-4">
                      {ing.isLowStock ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </span>
                      ) : ing.isExpiringSoon ? (
                        <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-900">
                          Expiring ({ing.daysToExpiry}d)
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                          Healthy
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "movements" && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-x-auto shadow-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F7F3] text-[#64748B]">
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Ingredient</th>
                <th className="py-3.5 px-4 font-semibold">Movement Type</th>
                <th className="py-3.5 px-4 font-semibold">Quantity Delta</th>
                <th className="py-3.5 px-4 font-semibold">Stock Transition</th>
                <th className="py-3.5 px-4 font-semibold">Financial Impact</th>
                <th className="py-3.5 px-4 font-semibold">Reason & Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {movements.map((m: any) => (
                <tr key={m._id} className="hover:bg-[#F8F7F3]/60">
                  <td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">
                    {new Date(m.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#101820]">
                    {m.ingredientNameSnapshot}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        m.type === "PURCHASE_RECEIVED" ||
                        m.type === "RETURN_REVERSAL"
                          ? "bg-emerald-100 text-emerald-900"
                          : m.type === "WASTE" || m.type === "SPOILAGE"
                          ? "bg-red-100 text-red-900"
                          : "bg-blue-100 text-blue-900"
                      }`}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 font-mono font-bold ${
                      m.quantityDelta >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {m.quantityDelta > 0 ? "+" : ""}
                    {m.quantityDelta} {m.unit}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#64748B]">
                    {m.previousStock} → {m.newStock} {m.unit}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {formatINR(m.totalCostPaise)}
                  </td>
                  <td className="py-3 px-4 text-[#64748B]">
                    {m.reason}
                    <span className="block text-[10px] text-[#64748B]">
                      By {m.performedByName}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "waste" && (
        <div className="space-y-4">
          {(wasteReport?.topWastedIngredients || []).map((item: any) => (
            <div
              key={item.ingredientId}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-base text-[#101820]">
                    {item.name}
                  </span>
                  <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-900">
                    {item.totalQuantityWasted} {item.unit} Wasted
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {item.recommendation}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] text-[#64748B] block">
                  Estimated Waste Cost
                </span>
                <span className="font-mono font-bold text-lg text-red-700">
                  {formatINR(item.totalWasteCostPaise)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {ingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-editorial space-y-4">
            <h3 className="font-display font-bold text-lg text-[#101820]">
              Add Tracked Ingredient
            </h3>
            <form onSubmit={handleCreateIngredient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Ingredient Name *
                </label>
                <input
                  required
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                  placeholder="Byadgi Dry Red Chillies"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Unit
                  </label>
                  <select
                    value={ingUnit}
                    onChange={(e) =>
                      setIngUnit(e.target.value as MeasurementUnit)
                    }
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="l">l (Litres)</option>
                    <option value="ml">ml (Millilitres)</option>
                    <option value="pcs">pcs (Pieces)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Opening Stock
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={ingStock}
                    onChange={(e) => setIngStock(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Cost/Unit (₹)
                  </label>
                  <input
                    type="number"
                    value={ingCostRupees}
                    onChange={(e) => setIngCostRupees(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Usable Yield %
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={ingYield}
                    onChange={(e) => setIngYield(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Reorder At
                  </label>
                  <input
                    type="number"
                    value={ingReorder}
                    onChange={(e) => setIngReorder(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIngModalOpen(false)}
                  className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white"
                >
                  Create Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {moveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-editorial space-y-4">
            <h3 className="font-display font-bold text-lg text-[#101820]">
              Record Auditable Stock Movement
            </h3>
            <form onSubmit={handleRecordMovement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Ingredient
                </label>
                <select
                  value={moveIngId}
                  onChange={(e) => setMoveIngId(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                >
                  {ingredients.map((i: any) => (
                    <option key={i._id} value={i._id}>
                      {i.name} (On hand: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Movement Type
                  </label>
                  <select
                    value={moveType}
                    onChange={(e) =>
                      setMoveType(e.target.value as InventoryMovementType)
                    }
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                  >
                    <option value="PURCHASE_RECEIVED">
                      PURCHASE_RECEIVED (+)
                    </option>
                    <option value="WASTE">WASTE (-)</option>
                    <option value="SPOILAGE">SPOILAGE (-)</option>
                    <option value="MANUAL_ADJUSTMENT">
                      MANUAL_ADJUSTMENT (-)
                    </option>
                    <option value="STOCK_CORRECTION">
                      STOCK_CORRECTION (-)
                    </option>
                    <option value="RETURN_REVERSAL">
                      RETURN_REVERSAL (+)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Quantity (in stock unit)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    min="0.01"
                    value={moveQty}
                    onChange={(e) => setMoveQty(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Audit Reason *
                </label>
                <input
                  required
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  placeholder="e.g. Morning delivery invoice #492 or evening trim waste"
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMoveModalOpen(false)}
                  className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white"
                >
                  Commit to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
