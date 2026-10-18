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
        <h2 className="font-display text-2xl font-bold text-[#101820]">
          Subscription Plan & Entitlements
        </h2>
        <p className="text-xs text-[#64748B]">
          Manage your active DinePilot SaaS subscription tier
        </p>
      </div>

      {!isLoading && sub && (
        <div className="rounded-2xl border border-[#176B52] bg-[#176B52] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="rounded bg-[#20A67A] px-2 py-0.5 text-[10px] font-bold text-[#101820]">
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
          <CreditCard className="h-8 w-8 text-[#20A67A] shrink-0" />
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
                  ? "border-[#176B52] ring-2 ring-[#176B52] bg-white"
                  : "border-[#E5E7EB] bg-white"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-[#101820]">
                    {p.name}
                  </h3>
                  {isCurrent && (
                    <span className="rounded-full bg-[#E8F3EF] px-2.5 py-0.5 text-[10px] font-bold text-[#101820]">
                      Active Plan
                    </span>
                  )}
                </div>
                <p className="font-mono text-2xl font-bold text-[#101820]">
                  {formatINR(p.pricePaise)}{" "}
                  <span className="text-xs font-normal text-[#64748B]">
                    / mo
                  </span>
                </p>
                <ul className="space-y-2 text-xs text-[#64748B]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[#101820] shrink-0 mt-0.5" />
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
                    ? "bg-[#E8F3EF] text-[#101820] cursor-default"
                    : "bg-[#176B52] text-white hover:bg-[#125541]"
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
