"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Plus, Gift, History } from "lucide-react";
import { formatINR, rupeesToPaise } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/AppProviders";

export default function LoyaltyLedgerPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);

  const [rewardName, setRewardName] = useState("");
  const [rewardDesc, setRewardDesc] = useState("");
  const [pointsCost, setPointsCost] = useState("250");
  const [discountRupees, setDiscountRupees] = useState("150");

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedRewardId, setSelectedRewardId] = useState("");

  const { data: customers = [] } = useQuery({
    queryKey: ["loyalty-customers"],
    queryFn: () => apiFetch("/loyalty/customers"),
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ["loyalty-rewards"],
    queryFn: () => apiFetch("/loyalty/rewards"),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["loyalty-transactions"],
    queryFn: () => apiFetch("/loyalty/transactions"),
  });

  async function handleCreateReward(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/loyalty/rewards", {
        method: "POST",
        body: JSON.stringify({
          name: rewardName,
          description: rewardDesc,
          pointsCost: Number(pointsCost) || 100,
          discountValuePaise: rupeesToPaise(Number(discountRupees) || 100),
          isActive: true,
        }),
      });
      toast({ title: `Created reward '${rewardName}'`, variant: "success" });
      setRewardName("");
      setRewardModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
    } catch (err: any) {
      toast({
        title: "Failed to create reward",
        description: err?.message,
        variant: "error",
      });
    }
  }

  async function handleRedeemReward(e: React.FormEvent) {
    e.preventDefault();
    try {
      const custId = selectedCustomerId || customers[0]?._id;
      const rewId = selectedRewardId || rewards[0]?._id;
      await apiFetch("/loyalty/redeem", {
        method: "POST",
        body: JSON.stringify({
          customerId: custId,
          rewardId: rewId,
          idempotencyKey: `redeem-${Date.now()}`,
        }),
      });
      toast({
        title: "Reward redeemed",
        description: "Auditable points ledger updated.",
        variant: "success",
      });
      setRedeemModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["loyalty-customers"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-transactions"] });
    } catch (err: any) {
      toast({
        title: "Redemption rejected",
        description: err?.message,
        variant: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F291E]">
            Loyalty Rewards & Auditable Points Ledger
          </h2>
          <p className="text-xs text-[#4A5950]">
            Points accrue idempotently when qualifying orders complete. Tier
            thresholds: Silver (400), Gold (1,000), Platinum (2,500).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (customers[0]) setSelectedCustomerId(customers[0]._id);
              if (rewards[0]) setSelectedRewardId(rewards[0]._id);
              setRedeemModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F291E] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#0F291E] hover:bg-[#F2EFE9]"
          >
            <Gift className="h-4 w-4 text-[#D97706]" />
            Redeem Customer Points
          </button>
          <button
            type="button"
            onClick={() => setRewardModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F291E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#163829]"
          >
            <Plus className="h-4 w-4 text-[#84CC16]" />
            Add Reward
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rewards.map((r: any) => (
          <div
            key={r._id}
            className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-card flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="rounded bg-[#E6ECE8] px-2.5 py-0.5 font-mono text-xs font-bold text-[#0F291E]">
                  {r.pointsCost} Points
                </span>
                <span className="font-mono text-xs font-semibold text-emerald-700">
                  Value: {formatINR(r.discountValuePaise)}
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-[#0F291E]">
                {r.name}
              </h3>
              <p className="text-xs text-[#4A5950] leading-relaxed">
                {r.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E5E0D5] bg-white overflow-x-auto shadow-card">
        <div className="p-4 border-b border-[#E5E0D5] flex items-center gap-2">
          <History className="h-4 w-4 text-[#0F291E]" />
          <h3 className="font-display font-bold text-sm text-[#0F291E]">
            Immutable Points Transaction Ledger
          </h3>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E0D5] bg-[#FBF9F5] text-[#4A5950]">
              <th className="py-3 px-4 font-semibold">Date & Time</th>
              <th className="py-3 px-4 font-semibold">Customer</th>
              <th className="py-3 px-4 font-semibold">Type</th>
              <th className="py-3 px-4 font-semibold">Points Delta</th>
              <th className="py-3 px-4 font-semibold">Balance After</th>
              <th className="py-3 px-4 font-semibold">Audit Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D5]">
            {transactions.map((tx: any) => (
              <tr key={tx._id} className="hover:bg-[#FBF9F5]/60">
                <td className="py-3 px-4 font-mono text-[11px] text-[#718077]">
                  {new Date(tx.createdAt).toLocaleString("en-IN")}
                </td>
                <td className="py-3 px-4 font-semibold text-[#0F291E]">
                  {tx.customerName}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      tx.type === "EARN" || tx.type === "BONUS"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {tx.type}
                  </span>
                </td>
                <td
                  className={`py-3 px-4 font-mono font-bold ${
                    tx.pointsDelta >= 0 ? "text-emerald-700" : "text-amber-800"
                  }`}
                >
                  {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta}{" "}
                  pts
                </td>
                <td className="py-3 px-4 font-mono font-semibold">
                  {tx.balanceAfter} pts
                </td>
                <td className="py-3 px-4 text-[#4A5950]">{tx.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rewardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E0D5] p-6 shadow-editorial space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0F291E]">
              Create Loyalty Reward
            </h3>
            <form onSubmit={handleCreateReward} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Reward Title *
                </label>
                <input
                  required
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  placeholder="Complimentary Santra Barfi Dessert"
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Points Required
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={pointsCost}
                    onChange={(e) => setPointsCost(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Discount Value (₹)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={discountRupees}
                    onChange={(e) => setDiscountRupees(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Description
                </label>
                <input
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRewardModalOpen(false)}
                  className="rounded-xl border border-[#E5E0D5] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F291E] px-4 py-2 text-xs font-semibold text-white"
                >
                  Create Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {redeemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E0D5] p-6 shadow-editorial space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0F291E]">
              Redeem Customer Loyalty Points
            </h3>
            <form onSubmit={handleRedeemReward} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Select Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                >
                  {customers.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.name} — {c.pointsBalance} pts ({c.tier})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Select Reward
                </label>
                <select
                  value={selectedRewardId}
                  onChange={(e) => setSelectedRewardId(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                >
                  {rewards.map((r: any) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.pointsCost} pts)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRedeemModalOpen(false)}
                  className="rounded-xl border border-[#E5E0D5] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F291E] px-4 py-2 text-xs font-semibold text-white"
                >
                  Confirm Redemption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
