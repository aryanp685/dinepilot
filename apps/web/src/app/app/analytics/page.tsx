"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Download } from "lucide-react";
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
          <h2 className="font-display text-2xl font-bold text-[#101820]">
            Menu Profitability Engine
          </h2>
          <p className="text-xs text-[#64748B]">
            Benchmarks: Avg Volume {benchmarks.avgUnitsSold} units • Avg Gross
            Margin {benchmarks.avgGrossMarginPercent}%
          </p>
        </div>

        <a
          href={`/api/v1/analytics/export?type=profitability&days=${days}`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541] transition-colors shadow-card"
        >
          <Download className="h-4 w-4 text-[#F8F7F3]" />
          Export Profitability CSV
        </a>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-card">
        <div className="inline-flex items-center gap-1 rounded-xl bg-[#F8F7F3] border border-[#E5E7EB] p-1">
          {[7, 30, 90].map((d) => {
            const active = days === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors z-10 ${
                  active
                    ? "text-white"
                    : "text-[#64748B] hover:text-[#101820]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="profitability-days-pill"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 rounded-lg bg-[#176B52] -z-10"
                  />
                )}
                {d} Days
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-1.5 text-xs font-semibold text-[#101820]"
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
            className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-1.5 text-xs font-semibold text-[#101820]"
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
            tone: "border-[#20A67A]/35 bg-[#E6F7F1]/60",
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
            tone: "border-[#C6A15B]/45 bg-[#FCF9F3]",
          },
          {
            key: "LOW_VOLUME_LOW_MARGIN" as const,
            title: "Dogs (Low Vol • Low Margin)",
            badge: "Re-engineer or Retire",
            tone: "border-[#E5E7EB] bg-white",
          },
        ].map((q) => {
          const group = quadrantGroups[q.key];
          return (
            <div
              key={q.key}
              className={`rounded-2xl border p-4 space-y-2.5 shadow-card ${q.tone}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B52]">
                  {q.badge}
                </span>
                <span className="font-mono text-xs font-bold text-[#101820] tabular-nums">
                  {group.length} Dish(es)
                </span>
              </div>
              <h3 className="font-display font-bold text-sm text-[#101820]">
                {q.title}
              </h3>
              <ul className="space-y-1 text-xs text-[#101820]">
                {group.length === 0 ? (
                  <li className="text-[#64748B] italic">None in this window</li>
                ) : (
                  group.map((item: any) => (
                    <li
                      key={item.menuItemId}
                      className="flex items-center justify-between bg-white/90 rounded-lg px-2.5 py-1.5 border border-[#E5E7EB]"
                    >
                      <span className="truncate pr-2 font-medium">
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-[#176B52] tabular-nums">
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

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4">
        <div>
          <h3 className="font-display font-bold text-base text-[#101820]">
            Net Sales vs. Estimated Gross Profit by Dish (INR)
          </h3>
          <p className="text-xs text-[#64748B]">
            Derived from actual order line items and yield-adjusted recipes
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip
                formatter={(v: any) => [`₹${v}`, ""]}
                contentStyle={{
                  borderRadius: "12px",
                  borderColor: "#E5E7EB",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="netSalesRupees"
                name="Net Sales (₹)"
                fill="#101820"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="grossProfitRupees"
                name="Est. Gross Profit (₹)"
                fill="#20A67A"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-x-auto shadow-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F8F7F3] text-[#64748B]">
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
          <tbody className="divide-y divide-[#E5E7EB]">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#64748B]">
                  Calculating profitability matrix...
                </td>
              </tr>
            ) : (
              items.map((item: any) => (
                <tr key={item.menuItemId} className="hover:bg-[#F8F7F3]/60">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#101820]">{item.name}</p>
                    <p className="text-[11px] text-[#64748B]">
                      {item.categoryName} • Price:{" "}
                      {formatINR(item.sellingPricePaise)}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold tabular-nums">
                    {item.unitsSold}
                    {item.cancelledUnits > 0 && (
                      <span className="block text-[10px] text-red-700">
                        ({item.cancelledUnits} cancelled)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums">
                    {formatINR(item.netSalesPaise)}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums">
                    {item.hasRecipe && item.totalIngredientCostPaise !== null ? (
                      formatINR(item.totalIngredientCostPaise)
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        Missing Recipe
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#20A67A] tabular-nums">
                    {item.estimatedGrossProfitPaise !== null
                      ? formatINR(item.estimatedGrossProfitPaise)
                      : "—"}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold tabular-nums">
                    {item.grossMarginPercent !== null
                      ? `${item.grossMarginPercent}%`
                      : "—"}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums">
                    {item.popularitySharePercent}%
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B] max-w-xs leading-relaxed">
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
