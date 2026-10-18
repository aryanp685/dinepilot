"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserCheck, Shield } from "lucide-react";
import { STAFF_ROLES, StaffRole } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/AppProviders";

export default function StaffManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [role, setRole] = useState<StaffRole>("WAITER");
  const [password, setPassword] = useState("StaffPass@123");

  const { data, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => apiFetch("/staff"),
  });

  const staffMembers = data?.staffMembers || [];
  const matrix = data?.rolePermissionMatrix || {};

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/staff", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone,
          role,
          password,
        }),
      });
      toast({
        title: `Added ${name} (${role})`,
        variant: "success",
      });
      setName("");
      setEmail("");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    } catch (err: any) {
      toast({
        title: "Failed to add staff member",
        description: err?.message,
        variant: "error",
      });
    }
  }

  async function handleChangeRole(membershipId: string, newRole: StaffRole) {
    try {
      await apiFetch(`/staff/${membershipId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      toast({ title: `Updated role to ${newRole}`, variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    } catch (err: any) {
      toast({
        title: "Role update rejected",
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
            Staff Access & Role Permission Matrix
          </h2>
          <p className="text-xs text-[#4A5950]">
            Roles (Owner, Manager, Cashier, Kitchen, Waiter) are enforced on the
            backend API for every request
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F291E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#163829]"
        >
          <Plus className="h-4 w-4 text-[#84CC16]" />
          Invite / Add Staff Member
        </button>
      </div>

      <div className="rounded-2xl border border-[#E5E0D5] bg-white overflow-x-auto shadow-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E0D5] bg-[#FBF9F5] text-[#4A5950]">
              <th className="py-3.5 px-4 font-semibold">Team Member</th>
              <th className="py-3.5 px-4 font-semibold">Email & Phone</th>
              <th className="py-3.5 px-4 font-semibold">Assigned Role</th>
              <th className="py-3.5 px-4 font-semibold">
                Granted Capabilities
              </th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D5]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#718077]">
                  Loading staff directory...
                </td>
              </tr>
            ) : (
              staffMembers.map((member: any) => (
                <tr key={member.membershipId} className="hover:bg-[#FBF9F5]/60">
                  <td className="py-3.5 px-4 font-bold text-[#0F291E]">
                    {member.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#4A5950]">
                    {member.email}
                    {member.phone ? ` • ${member.phone}` : ""}
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleChangeRole(
                          member.membershipId,
                          e.target.value as StaffRole
                        )
                      }
                      className="rounded-lg border border-[#E5E0D5] bg-[#FBF9F5] px-2.5 py-1 text-xs font-bold text-[#0F291E]"
                    >
                      {STAFF_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-[#4A5950]">
                    <span className="font-mono font-semibold text-[#0F291E]">
                      {member.permissions?.length || 0}
                    </span>{" "}
                    scopes ({(member.permissions || []).slice(0, 4).join(", ")}
                    ...)
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#0F291E]" />
          <h3 className="font-display font-bold text-base text-[#0F291E]">
            Documented RBAC Permission Matrix
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
          {STAFF_ROLES.map((r) => (
            <div
              key={r}
              className="rounded-xl border border-[#E5E0D5] bg-[#FBF9F5] p-3.5 space-y-2"
            >
              <span className="rounded bg-[#0F291E] px-2 py-0.5 text-[10px] font-bold text-white">
                {r}
              </span>
              <p className="text-[11px] text-[#718077]">
                {(matrix[r] || []).length} authorized scopes
              </p>
              <ul className="space-y-1 font-mono text-[10px] text-[#4A5950] max-h-40 overflow-y-auto">
                {(matrix[r] || []).map((perm: string) => (
                  <li key={perm}>• {perm}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E0D5] p-6 shadow-editorial space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0F291E]">
              Invite / Provision Staff Member
            </h3>
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs font-semibold"
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#E5E0D5] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F291E] px-4 py-2 text-xs font-semibold text-white"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
