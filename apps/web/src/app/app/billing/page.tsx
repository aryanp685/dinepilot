"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard } from "lucide-react";
import { formatINR, SubscriptionPlan } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useAuth, useToast } from "@/providers/AppProviders";

export default function BillingPage() {
  const queryClient = useQueryClient();
  const { refreshAuth } = useAuth();
  const { toast } = useToast();

  const { data: sub, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => apiFetch("/restaurant/subscription"),
  });

  async function handlePlanChange(plan: SubscriptionPlan) {
    try {
      await apiFetch("/restaurant/subscription", {
        method: "PATCH",
        body: JSON.stringify({ plan }),
      });
      await refreshAuth();
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({
        title: `Switched subscription plan to ${plan}`,
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Subscription update failed",
        description: err?.message,
        variant: "error",
      });
    }
  }

  const plans: Array<{
    id: SubscriptionPlan;
    name: string;
    pricePaise: number;
    maxTables: number;
    features: string[];
  }> = [
    {
      id: "STARTER",
      name: "Starter",
      pricePaise: 99900,
      maxTables: 15,
      features: [
        "Up to 15 QR Dine-In Tables",
        "Order State Machine & Live KDS",
        "GST Billing Engine",
        "Ingredient Stock Ledger",
      ],
    },
    {
      id: "GROWTH",
      name: "Growth",
      pricePaise: 249900,
      maxTables: 50,
      features: [
        "Up to 50 QR Dine-In Tables + Multi-KOT",
        "Yield-Adjusted Recipe Costing",
        "Menu Profitability Matrix",
        "AI Business Copilot & Loyalty Ledger",
      ],
    },
    {
      id: "SCALE",
      name: "Scale",
      pricePaise: 499900,
      maxTables: 200,
      features: [
        "Up to 200 QR Dine-In Tables",
        "Multi-Workspace Owner Switcher",
        "Granular Role Permission Matrix",
        "Full Audit Logs & Webhook Suite",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#0F291E]">
          Subscription Plan & Entitlements
        </h2>
        <p className="text-xs text-[#4A5950]">
          Manage your active DinePilot SaaS subscription tier
        </p>
      </div>

      {!isLoading && sub && (
        <div className="rounded-2xl border border-[#0F291E] bg-[#0F291E] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="rounded bg-[#84CC16] px-2 py-0.5 text-[10px] font-bold text-[#0F291E]">
              {sub.status} SUBSCRIPTION
            </span>
            <h3 className="font-display font-bold text-xl pt-1">
              Current Plan: {sub.plan} ({formatINR(sub.pricePaise)} / month)
            </h3>
            <p className="text-xs text-[#E6ECE8]/80">
              Max Tables: {sub.entitlements?.maxTables || 50} • AI Copilot:{" "}
              {sub.entitlements?.aiCopilot ? "Enabled" : "Disabled"} • Loyalty
              Ledger: {sub.entitlements?.loyaltyEngine ? "Enabled" : "Disabled"}
            </p>
          </div>
          <CreditCard className="h-8 w-8 text-[#84CC16] shrink-0" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = sub?.plan === p.id;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between space-y-5 ${
                isCurrent
                  ? "border-[#0F291E] ring-2 ring-[#0F291E] bg-white"
                  : "border-[#E5E0D5] bg-white"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-[#0F291E]">
                    {p.name}
                  </h3>
                  {isCurrent && (
                    <span className="rounded-full bg-[#E6ECE8] px-2.5 py-0.5 text-[10px] font-bold text-[#0F291E]">
                      Active Plan
                    </span>
                  )}
                </div>
                <p className="font-mono text-2xl font-bold text-[#0F291E]">
                  {formatINR(p.pricePaise)}{" "}
                  <span className="text-xs font-normal text-[#718077]">
                    / mo
                  </span>
                </p>
                <ul className="space-y-2 text-xs text-[#4A5950]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[#0F291E] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={isCurrent}
                onClick={() => handlePlanChange(p.id)}
                className={`w-full rounded-xl py-2.5 text-xs font-semibold transition-colors ${
                  isCurrent
                    ? "bg-[#E6ECE8] text-[#0F291E] cursor-default"
                    : "bg-[#0F291E] text-white hover:bg-[#163829]"
                }`}
              >
                {isCurrent ? "Current Plan" : `Switch to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
