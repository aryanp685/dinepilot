"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatINR, SubscriptionPlan } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/AppProviders";

export default function PlatformSubscriptionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["platform-subscriptions"],
    queryFn: () => apiFetch("/platform/subscriptions"),
  });

  async function handlePlanOverride(subId: string, plan: SubscriptionPlan) {
    try {
      await apiFetch(`/platform/subscriptions/${subId}`, {
        method: "PATCH",
        body: JSON.stringify({ plan }),
      });
      toast({
        title: `Updated tenant subscription to ${plan}`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["platform-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["platform-overview"] });
    } catch (err: any) {
      toast({
        title: "Subscription override failed",
        description: err?.message,
        variant: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#101820]">
          Tenant Subscriptions & Entitlement Overrides
        </h2>
        <p className="text-xs text-[#64748B]">
          Inspect and override subscription tiers across all restaurant tenants
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-x-auto shadow-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F8F7F3] text-[#64748B]">
              <th className="py-3.5 px-4 font-semibold">Restaurant Tenant</th>
              <th className="py-3.5 px-4 font-semibold">Current Plan</th>
              <th className="py-3.5 px-4 font-semibold">Monthly Fee</th>
              <th className="py-3.5 px-4 font-semibold">Max Tables</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#64748B]">
                  Loading subscriptions...
                </td>
              </tr>
            ) : (
              subscriptions.map((s: any) => (
                <tr key={s._id} className="hover:bg-[#F8F7F3]/60">
                  <td className="py-3.5 px-4 font-bold text-[#101820]">
                    {s.restaurantName}
                    <p className="font-mono text-[11px] font-normal text-[#64748B]">
                      {s.restaurantSlug}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={s.plan}
                      onChange={(e) =>
                        handlePlanOverride(
                          s._id,
                          e.target.value as SubscriptionPlan
                        )
                      }
                      className="rounded-lg border border-[#E5E7EB] bg-[#F8F7F3] px-2.5 py-1 text-xs font-bold text-[#101820]"
                    >
                      <option value="STARTER">STARTER</option>
                      <option value="GROWTH">GROWTH</option>
                      <option value="SCALE">SCALE</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#101820]">
                    {formatINR(s.pricePaise)}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {s.entitlements?.maxTables || 50}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      {s.status}
                    </span>
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
