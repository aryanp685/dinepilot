"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  TrendingUp,
  ClipboardList,
  Scale,
  AlertTriangle,
  BrainCircuit,
  ArrowRight,
  Users,
  Trash2,
  ReceiptIndianRupee,
} from "lucide-react";
import { formatINR } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";

export default function OverviewPage() {
  const [days, setDays] = useState(30);

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["analytics-overview", days],
    queryFn: () => apiFetch(`/analytics/overview?days=${days}`),
  });

  const { data: salesData } = useQuery({
    queryKey: ["analytics-sales", days],
    queryFn: () => apiFetch(`/analytics/sales?days=${days}`),
  });

  const { data: activeOrders = [] } = useQuery({
    queryKey: ["orders", "ACTIVE"],
    queryFn: () => apiFetch("/orders?status=ACTIVE"),
  });

  const { data: alerts } = useQuery({
    queryKey: ["inventory-alerts"],
    queryFn: () => apiFetch("/inventory/alerts"),
  });

  const kpiCards = [
    {
      label: "Net Sales (Excl. GST)",
      value: overview ? formatINR(overview.netSalesPaise) : "—",
      sub: overview
        ? `Gross: ${formatINR(overview.grossSalesPaise)} • Tax: ${formatINR(
            overview.totalTaxCollectedPaise
          )}`
        : "Loading...",
      icon: ReceiptIndianRupee,
      tone: "text-[#0F291E]",
    },
    {
      label: "Est. Gross Profit",
      value: overview
        ? formatINR(overview.totalEstimatedGrossProfitPaise)
        : "—",
      sub: overview
        ? `Food Cost: ${overview.overallFoodCostPercent}% (${formatINR(
            overview.totalIngredientCostPaise
          )})`
        : "Loading...",
      icon: TrendingUp,
      tone: "text-emerald-700",
    },
    {
      label: "Orders & AOV",
      value: overview ? `${overview.totalOrdersCount} Orders` : "—",
      sub: overview
        ? `Avg Order Value: ${formatINR(
            overview.averageOrderValuePaise
          )} (${overview.completedOrdersCount} completed)`
        : "Loading...",
      icon: ClipboardList,
      tone: "text-[#0F291E]",
    },
    {
      label: "Kitchen Waste & Retention",
      value: overview ? formatINR(overview.wasteCostPaise) : "—",
      sub: overview
        ? `Repeat Guests: ${overview.repeatCustomerRatePercent}% of ${overview.totalCustomers} profiles`
        : "Loading...",
      icon: Trash2,
      tone: "text-amber-700",
    },
  ];

  const categoryChartData = (salesData?.salesByCategory || []).map(
    (c: any) => ({
      name: c.categoryName,
      salesRupees: Math.round(c.salesPaise / 100),
      unitsSold: c.unitsSold,
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F291E]">
            Operations & Profitability Overview
          </h2>
          <p className="text-xs text-[#4A5950] mt-0.5">
            {overview?.accountingDefinition ||
              "Real-time financial, kitchen, and ingredient telemetry"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                days === d
                  ? "bg-[#0F291E] text-white"
                  : "bg-white border border-[#E5E0D5] text-[#4A5950] hover:text-[#0F291E]"
              }`}
            >
              Last {d} Days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-card space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#4A5950]">
                  {card.label}
                </span>
                <Icon className="h-4 w-4 text-[#0F291E]" />
              </div>
              {loadingOverview ? (
                <div className="h-7 w-28 rounded bg-[#F2EFE9] animate-pulse" />
              ) : (
                <p className={`font-mono text-2xl font-bold ${card.tone}`}>
                  {card.value}
                </p>
              )}
              <p className="text-[11px] text-[#718077] leading-relaxed">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-[#0F291E]">
                Live Floor & Kitchen Queue ({activeOrders.length})
              </h3>
              <p className="text-xs text-[#718077]">
                Active orders in NEW, ACCEPTED, PREPARING, or READY states
              </p>
            </div>
            <Link
              href="/app/orders"
              className="text-xs font-semibold text-[#0F291E] hover:underline inline-flex items-center gap-1"
            >
              Open Order Desk
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {activeOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E5E0D5] p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-[#0F291E]">
                No active orders in the queue right now
              </p>
              <p className="text-xs text-[#718077]">
                Create a staff POS order or place a test order via the Guest QR
                Menu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.slice(0, 5).map((ord: any) => (
                <div
                  key={ord._id}
                  className="rounded-xl border border-[#E5E0D5] bg-[#FBF9F5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#0F291E]">
                        {ord.orderNumber}
                      </span>
                      <span className="rounded-md bg-[#E6ECE8] px-2 py-0.5 text-[10px] font-bold text-[#0F291E]">
                        {ord.tableLabelSnapshot
                          ? `Table ${ord.tableLabelSnapshot}`
                          : ord.orderType}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          ord.status === "NEW"
                            ? "bg-amber-100 text-amber-900"
                            : ord.status === "READY"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-blue-100 text-blue-900"
                        }`}
                      >
                        {ord.status}
                      </span>
                      {ord.kotBatches?.length > 1 && (
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900">
                          {ord.kotBatches.length} KOTs
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#4A5950]">
                      {ord.items
                        .map((i: any) => `${i.quantity}x ${i.nameSnapshot}`)
                        .join(", ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm text-[#0F291E]">
                        {formatINR(ord.totalPaise)}
                      </p>
                      <p className="text-[10px] font-semibold uppercase text-[#718077]">
                        {ord.paymentStatus}
                      </p>
                    </div>
                    <Link
                      href="/app/orders"
                      className="rounded-lg bg-[#0F291E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#163829]"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-[#0F291E]">
                Revenue by Menu Category
              </h3>
              <p className="text-xs text-[#718077]">
                Measured gross line sales in INR (₹)
              </p>
            </div>
            <Link
              href="/app/analytics"
              className="text-xs font-semibold text-[#0F291E] hover:underline"
            >
              Profitability Matrix →
            </Link>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-[#718077]">
              No category sales recorded in this period.
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${val}`, "Revenue"]}
                    contentStyle={{
                      borderRadius: "12px",
                      borderColor: "#E5E0D5",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="salesRupees"
                    fill="#0F291E"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#D97706]" />
              <h3 className="font-display font-bold text-base text-[#0F291E]">
                Ingredient Replenishment & Expiry Alerts
              </h3>
            </div>
            <Link
              href="/app/inventory"
              className="text-xs font-semibold text-[#0F291E] hover:underline"
            >
              Manage Inventory →
            </Link>
          </div>

          {!alerts ||
          (alerts.lowStockAlerts?.length === 0 &&
            alerts.expiringAlerts?.length === 0) ? (
            <p className="text-xs text-[#718077] py-4">
              All tracked ingredients are currently above their safety reorder
              thresholds.
            </p>
          ) : (
            <div className="space-y-2.5">
              {(alerts.lowStockAlerts || []).slice(0, 4).map((item: any) => (
                <div
                  key={item.ingredientId}
                  className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-bold text-amber-950">
                      {item.name} — {item.currentStock} {item.unit} on hand
                      (Threshold: {item.reorderThreshold} {item.unit})
                    </p>
                    <p className="text-[11px] text-amber-900/80 mt-0.5">
                      {item.explanation}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-white border border-amber-200 px-2.5 py-1 font-mono text-xs font-bold text-[#0F291E]">
                    Order +{item.suggestedOrderQty} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-[#0F291E] text-white p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#84CC16] px-2.5 py-0.5 text-[10px] font-bold text-[#0F291E]">
              <BrainCircuit className="h-3.5 w-3.5" />
              AI Business Copilot
            </span>
            <h3 className="font-display font-bold text-xl">
              Ask DinePilot Copilot about your margins & stock burn
            </h3>
            <p className="text-xs text-[#E6ECE8]/80 leading-relaxed">
              Identify high-volume dishes with compressed margins, forecast
              7-day ingredient purchasing needs, and audit kitchen waste drivers.
            </p>
          </div>
          <Link
            href="/app/ai-insights"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#84CC16] py-3 px-4 text-xs font-bold text-[#0F291E] hover:bg-[#9BE028] transition-colors"
          >
            Launch AI Business Copilot
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
