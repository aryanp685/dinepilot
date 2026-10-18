"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Download,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Compass,
} from "lucide-react";
import { formatINR } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";

export default function ProfitabilityAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [categoryId, setCategoryId] = useState("ALL");
  const [orderType, setOrderType] = useState("ALL");

  const { data: matrix, isLoading } = useQuery({
    queryKey: ["profitability", days, categoryId, orderType],
    queryFn: () =>
      apiFetch(
        `/analytics/menu-profitability?days=${days}&categoryId=${categoryId}&orderType=${orderType}`
      ),
  });

  const { data: menuData } = useQuery({
    queryKey: ["menu"],
    queryFn: () => apiFetch("/menu"),
  });

  const items = matrix?.items || [];
  const benchmarks = matrix?.benchmarks || {
    avgUnitsSold: 0,
    avgGrossMarginPercent: 60,
  };

  const quadrantGroups = {
    HIGH_VOLUME_HIGH_MARGIN: items.filter(
      (i: any) => i.quadrant === "HIGH_VOLUME_HIGH_MARGIN"
    ),
    HIGH_VOLUME_LOW_MARGIN: items.filter(
      (i: any) => i.quadrant === "HIGH_VOLUME_LOW_MARGIN"
    ),
    LOW_VOLUME_HIGH_MARGIN: items.filter(
      (i: any) => i.quadrant === "LOW_VOLUME_HIGH_MARGIN"
    ),
    LOW_VOLUME_LOW_MARGIN: items.filter(
      (i: any) => i.quadrant === "LOW_VOLUME_LOW_MARGIN"
    ),
  };

  const chartData = items.map((i: any) => ({
    name: i.name.length > 18 ? `${i.name.slice(0, 18)}…` : i.name,
    grossProfitRupees: Math.round((i.estimatedGrossProfitPaise || 0) / 100),
    netSalesRupees: Math.round(i.netSalesPaise / 100),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F291E]">
            Menu Profitability Engine
          </h2>
          <p className="text-xs text-[#4A5950]">
            Benchmarks: Avg Volume {benchmarks.avgUnitsSold} units • Avg Gross
            Margin {benchmarks.avgGrossMarginPercent}%
          </p>
        </div>

        <a
          href={`/api/v1/analytics/export?type=profitability&days=${days}`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F291E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#163829]"
        >
          <Download className="h-4 w-4 text-[#84CC16]" />
          Export Profitability CSV
        </a>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E0D5] bg-white p-4">
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                days === d
                  ? "bg-[#0F291E] text-white"
                  : "bg-[#FBF9F5] text-[#4A5950]"
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border border-[#E5E0D5] bg-[#FBF9F5] px-3 py-1.5 text-xs font-semibold"
          >
            <option value="ALL">All Categories</option>
            {(menuData?.categories || []).map((c: any) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="rounded-lg border border-[#E5E0D5] bg-[#FBF9F5] px-3 py-1.5 text-xs font-semibold"
          >
            <option value="ALL">All Order Channels</option>
            <option value="DINE_IN">Dine-In Only</option>
            <option value="TAKEAWAY">Takeaway Only</option>
            <option value="DELIVERY">Delivery Only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            key: "HIGH_VOLUME_HIGH_MARGIN" as const,
            title: "Stars (High Vol • High Margin)",
            badge: "Protect & Promote",
            tone: "border-emerald-300 bg-emerald-50/50",
          },
          {
            key: "HIGH_VOLUME_LOW_MARGIN" as const,
            title: "Plowhorses (High Vol • Low Margin)",
            badge: "Reprice or Portion-Tune",
            tone: "border-amber-300 bg-amber-50/50",
          },
          {
            key: "LOW_VOLUME_HIGH_MARGIN" as const,
            title: "Puzzles (Low Vol • High Margin)",
            badge: "Upsell in QR Cart",
            tone: "border-blue-300 bg-blue-50/50",
          },
          {
            key: "LOW_VOLUME_LOW_MARGIN" as const,
            title: "Dogs (Low Vol • Low Margin)",
            badge: "Re-engineer or Retire",
            tone: "border-stone-300 bg-stone-50",
          },
        ].map((q) => {
          const group = quadrantGroups[q.key];
          return (
            <div
              key={q.key}
              className={`rounded-2xl border p-4 space-y-2.5 ${q.tone}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F291E]">
                  {q.badge}
                </span>
                <span className="font-mono text-xs font-bold text-[#0F291E]">
                  {group.length} Dish(es)
                </span>
              </div>
              <h3 className="font-display font-bold text-sm text-[#0F291E]">
                {q.title}
              </h3>
              <ul className="space-y-1 text-xs text-[#111C16]">
                {group.length === 0 ? (
                  <li className="text-[#718077] italic">None in this window</li>
                ) : (
                  group.map((item: any) => (
                    <li
                      key={item.menuItemId}
                      className="flex items-center justify-between bg-white/80 rounded px-2 py-1 border border-black/5"
                    >
                      <span className="truncate pr-2 font-medium">
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] font-semibold">
                        {item.grossMarginPercent !== null
                          ? `${item.grossMarginPercent}%`
                          : "No Recipe"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-card space-y-4">
        <div>
          <h3 className="font-display font-bold text-base text-[#0F291E]">
            Net Sales vs. Estimated Gross Profit by Dish (INR)
          </h3>
          <p className="text-xs text-[#718077]">
            Derived from actual order line items and yield-adjusted recipes
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: any) => [`₹${v}`, ""]}
                contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
              />
              <Bar
                dataKey="netSalesRupees"
                name="Net Sales (₹)"
                fill="#286249"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="grossProfitRupees"
                name="Est. Gross Profit (₹)"
                fill="#84CC16"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E0D5] bg-white overflow-x-auto shadow-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E0D5] bg-[#FBF9F5] text-[#4A5950]">
              <th className="py-3.5 px-4 font-semibold">Dish & Category</th>
              <th className="py-3.5 px-4 font-semibold">Units Sold</th>
              <th className="py-3.5 px-4 font-semibold">Net Sales</th>
              <th className="py-3.5 px-4 font-semibold">Ingredient Cost</th>
              <th className="py-3.5 px-4 font-semibold">Est. Gross Profit</th>
              <th className="py-3.5 px-4 font-semibold">Gross Margin %</th>
              <th className="py-3.5 px-4 font-semibold">Popularity</th>
              <th className="py-3.5 px-4 font-semibold">
                Engineering Recommendation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D5]">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#718077]">
                  Calculating profitability matrix...
                </td>
              </tr>
            ) : (
              items.map((item: any) => (
                <tr key={item.menuItemId} className="hover:bg-[#FBF9F5]/60">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#0F291E]">{item.name}</p>
                    <p className="text-[11px] text-[#718077]">
                      {item.categoryName} • Price:{" "}
                      {formatINR(item.sellingPricePaise)}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {item.unitsSold}
                    {item.cancelledUnits > 0 && (
                      <span className="block text-[10px] text-red-700">
                        ({item.cancelledUnits} cancelled)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {formatINR(item.netSalesPaise)}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {item.hasRecipe && item.totalIngredientCostPaise !== null ? (
                      formatINR(item.totalIngredientCostPaise)
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        Missing Recipe
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                    {item.estimatedGrossProfitPaise !== null
                      ? formatINR(item.estimatedGrossProfitPaise)
                      : "—"}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {item.grossMarginPercent !== null
                      ? `${item.grossMarginPercent}%`
                      : "—"}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {item.popularitySharePercent}%
                  </td>
                  <td className="py-3.5 px-4 text-[#4A5950] max-w-xs leading-relaxed">
                    {item.recommendation}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
