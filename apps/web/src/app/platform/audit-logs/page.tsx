"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export default function PlatformAuditLogsPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["platform-audit-logs"],
    queryFn: () => apiFetch("/platform/audit-logs"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#101820]">
          Platform & Security Audit Logs
        </h2>
        <p className="text-xs text-[#64748B]">
          Immutable record of administrative actions, role changes, payment
          verifications, and stock adjustments
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-x-auto shadow-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F8F7F3] text-[#64748B]">
              <th className="py-3 px-4 font-semibold">Timestamp</th>
              <th className="py-3 px-4 font-semibold">Actor</th>
              <th className="py-3 px-4 font-semibold">Action</th>
              <th className="py-3 px-4 font-semibold">Target</th>
              <th className="py-3 px-4 font-semibold">Request ID</th>
              <th className="py-3 px-4 font-semibold">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#64748B]">
                  Loading security audit logs...
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log._id} className="hover:bg-[#F8F7F3]/60">
                  <td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#101820]">
                    {log.actorEmail || "SYSTEM"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded bg-[#E8F3EF] px-2 py-0.5 font-mono text-[10px] font-bold text-[#101820]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {log.targetType}
                    {log.targetId ? `:${String(log.targetId).slice(-6)}` : ""}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">
                    {log.requestId || "—"}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-[#64748B] max-w-xs truncate">
                    {JSON.stringify(log.metadata || {})}
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
