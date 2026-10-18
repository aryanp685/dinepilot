"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Store, Users, CreditCard, ShoppingBag, TrendingUp } from "lucide-react";
import { formatINR } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";

export default function PlatformOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["platform-overview"],
    queryFn: () => apiFetch("/platform/overview"),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-[#0F291E]">
          Platform Multi-Tenant Telemetry
        </h2>
        <p className="text-xs text-[#4A5950]">Loading platform metrics...</p>
      </div>
    );
  }

  const cards = [
    {
      label: "Tenant Restaurants",
      value: `${data.activeRestaurants} / ${data.totalRestaurants} Active`,
      icon: Store,
    },
    {
      label: "Registered Users",
      value: String(data.totalUsers),
      icon: Users,
    },
    {
      label: "Monthly Recurring Revenue (MRR)",
      value: formatINR(data.mrrPaise),
      icon: CreditCard,
    },
    {
      label: "Platform GMV Processed",
      value: formatINR(data.totalPlatformGmvPaise),
      icon: TrendingUp,
    },
    {
      label: "Total Orders Dispatched",
      value: String(data.totalOrdersProcessed),
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#0F291E]">
          Platform Control Plane Overview
        </h2>
        <p className="text-xs text-[#4A5950]">
          Real-time SaaS tenant health, recurring subscription revenue, and
          platform-wide GMV
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-card space-y-2"
            >
              <div className="flex items-center justify-between text-[#4A5950]">
                <span className="text-xs font-semibold">{c.label}</span>
                <Icon className="h-4 w-4 text-[#0F291E]" />
              </div>
              <p className="font-mono text-xl font-bold text-[#0F291E]">
                {c.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
