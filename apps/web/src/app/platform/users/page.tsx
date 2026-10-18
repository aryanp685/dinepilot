"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export default function PlatformUsersPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["platform-users"],
    queryFn: () => apiFetch("/platform/users"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#0F291E]">
          Platform Users & Tenant Memberships
        </h2>
        <p className="text-xs text-[#4A5950]">
          Inspect user accounts, platform admin flags, and assigned restaurant
          workspaces
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E0D5] bg-white overflow-x-auto shadow-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E0D5] bg-[#FBF9F5] text-[#4A5950]">
              <th className="py-3.5 px-4 font-semibold">User Name</th>
              <th className="py-3.5 px-4 font-semibold">Email & Phone</th>
              <th className="py-3.5 px-4 font-semibold">Platform Role</th>
              <th className="py-3.5 px-4 font-semibold">
                Tenant Memberships
              </th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D5]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#718077]">
                  Loading platform users...
                </td>
              </tr>
            ) : (
              users.map((u: any) => (
                <tr key={u._id} className="hover:bg-[#FBF9F5]/60">
                  <td className="py-3.5 px-4 font-bold text-[#0F291E]">
                    {u.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#4A5950]">
                    {u.email} {u.phone ? `• ${u.phone}` : ""}
                  </td>
                  <td className="py-3.5 px-4">
                    {u.isPlatformAdmin ? (
                      <span className="rounded bg-[#0F291E] px-2 py-0.5 text-[10px] font-bold text-[#84CC16]">
                        PLATFORM ADMIN
                      </span>
                    ) : (
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                        TENANT USER
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {(u.memberships || []).length} workspace(s) (
                    {(u.memberships || []).map((m: any) => m.role).join(", ")})
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      {u.isActive ? "ACTIVE" : "DISABLED"}
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
