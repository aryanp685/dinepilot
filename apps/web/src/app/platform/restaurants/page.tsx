"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Power } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/AppProviders";

export default function PlatformRestaurantsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ["platform-restaurants"],
    queryFn: () => apiFetch("/platform/restaurants"),
  });

  async function handleToggleActive(r: any) {
    try {
      await apiFetch(`/platform/restaurants/${r._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !r.isActive }),
      });
      toast({
        title: `${r.name} is now ${!r.isActive ? "ACTIVE" : "SUSPENDED"}`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["platform-restaurants"] });
    } catch (err: any) {
      toast({
        title: "Failed to update tenant status",
        description: err?.message,
        variant: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#0F291E]">
          Tenant Restaurants Directory
        </h2>
        <p className="text-xs text-[#4A5950]">
          Inspect multi-tenant restaurant workspaces, GST settings, and QR
          ordering status
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E0D5] bg-white overflow-x-auto shadow-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E0D5] bg-[#FBF9F5] text-[#4A5950]">
              <th className="py-3.5 px-4 font-semibold">Restaurant Name</th>
              <th className="py-3.5 px-4 font-semibold">Slug & QR Menu</th>
              <th className="py-3.5 px-4 font-semibold">Location</th>
              <th className="py-3.5 px-4 font-semibold">GST Mode</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D5]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#718077]">
                  Loading tenant restaurants...
                </td>
              </tr>
            ) : (
              restaurants.map((r: any) => (
                <tr key={r._id} className="hover:bg-[#FBF9F5]/60">
                  <td className="py-3.5 px-4 font-bold text-[#0F291E]">
                    {r.name}
                    {r.isDemo && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                        DEMO
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <Link
                      href={`/menu/${r.slug}`}
                      className="inline-flex items-center gap-1 text-[#0F291E] underline"
                    >
                      /menu/{r.slug}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-[#4A5950]">
                    {r.city}, {r.state}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {r.settings?.taxMode}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        r.isActive
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-red-100 text-red-900"
                      }`}
                    >
                      {r.isActive ? "ACTIVE" : "SUSPENDED"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(r)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E5E0D5] px-2.5 py-1 text-[11px] font-semibold hover:bg-[#F2EFE9]"
                    >
                      <Power className="h-3 w-3" />
                      {r.isActive ? "Suspend" : "Activate"}
                    </button>
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
