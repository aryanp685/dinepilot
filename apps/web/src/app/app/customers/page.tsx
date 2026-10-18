"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Star, ShieldCheck, ShieldOff } from "lucide-react";
import { formatINR } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/AppProviders";

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [notes, setNotes] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["loyalty-customers"],
    queryFn: () => apiFetch("/loyalty/customers"),
  });

  async function handleSaveCustomer(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/loyalty/customers", {
        method: "POST",
        body: JSON.stringify({
          name,
          phone,
          email,
          marketingConsent,
          notes,
        }),
      });
      toast({
        title: `Saved customer profile for ${name}`,
        variant: "success",
      });
      setName("");
      setNotes("");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["loyalty-customers"] });
    } catch (err: any) {
      toast({
        title: "Failed to save customer",
        description: err?.message,
        variant: "error",
      });
    }
  }

  async function handleToggleConsent(customer: any) {
    try {
      await apiFetch(`/loyalty/customers/${customer._id}/consent`, {
        method: "PATCH",
        body: JSON.stringify({
          marketingConsent: !customer.marketingConsent,
        }),
      });
      toast({
        title: `Updated marketing consent for ${customer.name}`,
        description: !customer.marketingConsent
          ? "Customer opted in to promotional offers."
          : "Customer opted out of promotional messaging.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["loyalty-customers"] });
    } catch (err: any) {
      toast({
        title: "Consent update failed",
        description: err?.message,
        variant: "error",
      });
    }
  }

  const repeatCount = customers.filter((c: any) => c.visitCount > 1).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#101820]">
            Customer Directory & Privacy Controls
          </h2>
          <p className="text-xs text-[#64748B]">
            Track visit frequency, dining notes, feedback ratings, and explicit
            promotional consent
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541]"
        >
          <Plus className="h-4 w-4 text-[#20A67A]" />
          Add Customer Profile
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <span className="text-xs font-semibold text-[#64748B]">
            Total Registered Guests
          </span>
          <p className="font-mono text-2xl font-bold text-[#101820] mt-1">
            {customers.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <span className="text-xs font-semibold text-[#64748B]">
            Repeat Customers (2+ Visits)
          </span>
          <p className="font-mono text-2xl font-bold text-emerald-700 mt-1">
            {repeatCount} (
            {customers.length > 0
              ? Math.round((repeatCount / customers.length) * 100)
              : 0}
            %)
          </p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <span className="text-xs font-semibold text-[#64748B]">
            Opted-In for Promotions
          </span>
          <p className="font-mono text-2xl font-bold text-[#101820] mt-1">
            {customers.filter((c: any) => c.marketingConsent).length} Guests
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-x-auto shadow-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F8F7F3] text-[#64748B]">
              <th className="py-3.5 px-4 font-semibold">Guest Profile</th>
              <th className="py-3.5 px-4 font-semibold">Loyalty Tier & Pts</th>
              <th className="py-3.5 px-4 font-semibold">Visits</th>
              <th className="py-3.5 px-4 font-semibold">Lifetime Spend</th>
              <th className="py-3.5 px-4 font-semibold">Feedback & Notes</th>
              <th className="py-3.5 px-4 font-semibold">Marketing Consent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#64748B]">
                  Loading customer directory...
                </td>
              </tr>
            ) : (
              customers.map((c: any) => (
                <tr key={c._id} className="hover:bg-[#F8F7F3]/60">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#101820]">{c.name}</p>
                    <p className="font-mono text-[11px] text-[#64748B]">
                      {c.phone} {c.email ? `• ${c.email}` : ""}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="rounded bg-[#E8F3EF] px-2 py-0.5 text-[10px] font-bold text-[#101820]">
                      {c.tier}
                    </span>
                    <span className="ml-2 font-mono font-bold text-[#101820]">
                      {c.pointsBalance} pts
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {c.visitCount}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#101820]">
                    {formatINR(c.totalSpentPaise)}
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B] max-w-xs">
                    {c.notes && <p className="text-[11px]">{c.notes}</p>}
                    {c.feedbacks?.length > 0 && (
                      <p className="text-[11px] text-amber-800 inline-flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        {c.feedbacks[c.feedbacks.length - 1].rating}/5 — “
                        {c.feedbacks[c.feedbacks.length - 1].comment}”
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleConsent(c)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold border ${
                        c.marketingConsent
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-stone-100 border-stone-300 text-stone-700"
                      }`}
                    >
                      {c.marketingConsent ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Opted In
                        </>
                      ) : (
                        <>
                          <ShieldOff className="h-3.5 w-3.5" />
                          Opted Out
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-editorial space-y-4">
            <h3 className="font-display font-bold text-lg text-[#101820]">
              Create Customer Profile
            </h3>
            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Phone Number *
                </label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Hospitality Notes
                </label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-[#64748B] pt-1">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                />
                <span>
                  Guest explicitly consented to receive loyalty & promotional
                  updates
                </span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
