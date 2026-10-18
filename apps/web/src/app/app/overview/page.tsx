"use client";

import React, { useState } from "react";
import Link from "next/link";
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
import {
  TrendingUp,
  ClipboardList,
  AlertTriangle,
  BrainCircuit,
  ArrowRight,
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
      tone: "text-[#101820]",
      iconBg: "bg-[#E8F3EF] text-[#176B52]",
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
      tone: "text-[#20A67A]",
      iconBg: "bg-[#E6F7F1] text-[#20A67A]",
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
      tone: "text-[#101820]",
      iconBg: "bg-[#F8F7F3] text-[#101820]",
    },
    {
      label: "Kitchen Waste & Retention",
      value: overview ? formatINR(overview.wasteCostPaise) : "—",
      sub: overview
        ? `Repeat Guests: ${overview.repeatCustomerRatePercent}% of ${overview.totalCustomers} profiles`
        : "Loading...",
      icon: Trash2,
      tone: "text-amber-700",
      iconBg: "bg-amber-50 text-amber-700",
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
          <h2 className="font-display text-2xl font-bold text-[#101820]">
            Operations & Profitability Overview
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {overview?.accountingDefinition ||
              "Real-time financial, kitchen, and ingredient telemetry"}
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-card">
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
                    layoutId="overview-days-pill"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 rounded-lg bg-[#176B52] -z-10"
                  />
                )}
                Last {d} Days
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-card hover:shadow-editorial transition-shadow space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748B]">
                  {card.label}
                </span>
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.iconBg}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              {loadingOverview ? (
                <div className="h-7 w-28 rounded bg-[#F1EFE9] animate-pulse" />
              ) : (
                <p
                  className={`font-mono text-2xl font-bold tabular-nums ${card.tone}`}
                >
                  {card.value}
                </p>
              )}
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-[#101820]">
                Live Floor & Kitchen Queue ({activeOrders.length})
              </h3>
              <p className="text-xs text-[#64748B]">
                Active orders in NEW, ACCEPTED, PREPARING, or READY states
              </p>
            </div>
            <Link
              href="/app/orders"
              className="text-xs font-semibold text-[#176B52] hover:underline inline-flex items-center gap-1"
            >
              Open Order Desk
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {activeOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E5E7EB] p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-[#101820]">
                No active orders in the queue right now
              </p>
              <p className="text-xs text-[#64748B]">
                Create a staff POS order or place a test order via the Guest QR
                Menu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.slice(0, 5).map((ord: any) => (
                <div
                  key={ord._id}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#101820]">
                        {ord.orderNumber}
                      </span>
                      <span className="rounded-md bg-[#E8F3EF] px-2 py-0.5 text-[10px] font-bold text-[#176B52]">
                        {ord.tableLabelSnapshot
                          ? `Table ${ord.tableLabelSnapshot}`
                          : ord.orderType}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          ord.status === "NEW"
                            ? "bg-amber-100 text-amber-900"
                            : ord.status === "READY"
                            ? "bg-[#E6F7F1] text-[#176B52]"
                            : "bg-blue-100 text-blue-900"
                        }`}
                      >
                        {ord.status}
                      </span>
                      {ord.kotBatches?.length > 1 && (
                        <span className="rounded-md bg-[#F9F4EA] border border-[#C6A15B]/30 px-2 py-0.5 text-[10px] font-bold text-[#101820]">
                          {ord.kotBatches.length} KOTs
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B]">
                      {ord.items
                        .map((i: any) => `${i.quantity}x ${i.nameSnapshot}`)
                        .join(", ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm text-[#101820] tabular-nums">
                        {formatINR(ord.totalPaise)}
                      </p>
                      <p className="text-[10px] font-semibold uppercase text-[#64748B]">
                        {ord.paymentStatus}
                      </p>
                    </div>
                    <Link
                      href="/app/orders"
                      className="rounded-xl bg-[#176B52] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#125541] transition-colors"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-[#101820]">
                Revenue by Menu Category
              </h3>
              <p className="text-xs text-[#64748B]">
                Measured gross line sales in INR (₹)
              </p>
            </div>
            <Link
              href="/app/analytics"
              className="text-xs font-semibold text-[#176B52] hover:underline"
            >
              Profitability Matrix →
            </Link>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-[#64748B]">
              No category sales recorded in this period.
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 11, fill: "#101820" }}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${val}`, "Revenue"]}
                    contentStyle={{
                      borderRadius: "12px",
                      borderColor: "#E5E7EB",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="salesRupees"
                    fill="#176B52"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-display font-bold text-base text-[#101820]">
                Ingredient Replenishment & Expiry Alerts
              </h3>
            </div>
            <Link
              href="/app/inventory"
              className="text-xs font-semibold text-[#176B52] hover:underline"
            >
              Manage Inventory →
            </Link>
          </div>

          {!alerts ||
          (alerts.lowStockAlerts?.length === 0 &&
            alerts.expiringAlerts?.length === 0) ? (
            <p className="text-xs text-[#64748B] py-4">
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
                  <span className="shrink-0 rounded-lg bg-white border border-amber-200 px-2.5 py-1 font-mono text-xs font-bold text-[#101820]">
                    Order +{item.suggestedOrderQty} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-navy-mesh text-white p-6 flex flex-col justify-between space-y-4 shadow-navy">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#C6A15B]">
              <BrainCircuit className="h-3.5 w-3.5" />
              AI Business Copilot
            </span>
            <h3 className="font-display font-bold text-xl">
              Ask DinePilot Copilot about your margins & stock burn
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Identify high-volume dishes with compressed margins, forecast
              7-day ingredient purchasing needs, and audit kitchen waste drivers.
            </p>
          </div>
          <Link
            href="/app/ai-insights"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#176B52] py-3 px-4 text-xs font-bold text-white hover:bg-[#125541] transition-colors"
          >
            Launch AI Business Copilot
            <ArrowRight className="h-4 w-4 text-[#20A67A]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
