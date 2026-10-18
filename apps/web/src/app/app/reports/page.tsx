"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Info } from "lucide-react";
import { formatINR } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";

export default function ReportsPage() {
  const [days, setDays] = useState(30);

  const { data: overview } = useQuery({
    queryKey: ["analytics-overview", days],
    queryFn: () => apiFetch(`/analytics/overview?days=${days}`),
  });

  const reportCards = [
    {
      type: "profitability",
      title: "Menu Profitability & Engineering Matrix CSV",
      desc: "Dish-by-dish units sold, gross sales, net sales, yield-adjusted ingredient cost, gross profit in INR, food cost %, and quadrant classification.",
    },
    {
      type: "sales",
      title: "GST & Net Sales Accounting Ledger CSV",
      desc: "Period summary with gross subtotal, discounts, net sales, CGST/SGST tax breakdown, and completed order counts.",
    },
    {
      type: "inventory",
      title: "Ingredient Consumption & Waste Audit CSV",
      desc: "Exports dish recipe cost vs. selling price and highlights missing recipe configurations.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F291E]">
            Automated Business Reports & CSV Exports
          </h2>
          <p className="text-xs text-[#4A5950]">
            Consistent accounting definitions across dashboard charts and
            downloadable reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                days === d
                  ? "bg-[#0F291E] text-white"
                  : "bg-white border border-[#E5E0D5] text-[#4A5950]"
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {overview && (
        <div className="rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-card space-y-4">
          <div className="flex items-start gap-2.5 text-xs text-[#0F291E]">
            <Info className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" />
            <p>{overview.accountingDefinition}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-[#E5E0D5] text-xs">
            <div>
              <span className="text-[#718077] block">Gross Sales</span>
              <span className="font-mono font-bold text-base text-[#0F291E]">
                {formatINR(overview.grossSalesPaise)}
              </span>
            </div>
            <div>
              <span className="text-[#718077] block">
                Net Sales (Excl. Tax)
              </span>
              <span className="font-mono font-bold text-base text-[#0F291E]">
                {formatINR(overview.netSalesPaise)}
              </span>
            </div>
            <div>
              <span className="text-[#718077] block">CGST + SGST Collected</span>
              <span className="font-mono font-bold text-base text-[#0F291E]">
                {formatINR(overview.totalTaxCollectedPaise)}
              </span>
            </div>
            <div>
              <span className="text-[#718077] block">Est. Gross Profit</span>
              <span className="font-mono font-bold text-base text-emerald-700">
                {formatINR(overview.totalEstimatedGrossProfitPaise)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reportCards.map((card) => (
          <div
            key={card.type}
            className="rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-card flex flex-col justify-between space-y-5"
          >
            <div className="space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-[#E6ECE8] text-[#0F291E] flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-base text-[#0F291E]">
                {card.title}
              </h3>
              <p className="text-xs text-[#4A5950] leading-relaxed">
                {card.desc}
              </p>
            </div>

            <a
              href={`/api/v1/analytics/export?type=${card.type}&days=${days}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F291E] py-2.5 px-4 text-xs font-semibold text-white hover:bg-[#163829]"
            >
              <Download className="h-3.5 w-3.5 text-[#84CC16]" />
              Download CSV ({days}d)
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
