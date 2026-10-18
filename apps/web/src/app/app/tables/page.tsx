"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import {
  Plus,
  QrCode,
  RefreshCw,
  Printer,
  ExternalLink,
  Users,
} from "lucide-react";
import { formatINR } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useAuth, useToast } from "@/providers/AppProviders";

export default function TablesAndQrPage() {
  const queryClient = useQueryClient();
  const { restaurant } = useAuth();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [label, setLabel] = useState("");
  const [zone, setZone] = useState("Indoor AC Dining");
  const [capacity, setCapacity] = useState("4");

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: () => apiFetch("/tables"),
  });

  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  async function handleCreateTable(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/tables", {
        method: "POST",
        body: JSON.stringify({
          label,
          zone,
          capacity: Number(capacity) || 4,
          isActive: true,
        }),
      });
      toast({
        title: `Created Table ${label}`,
        description: "Cryptographic QR token generated.",
        variant: "success",
      });
      setLabel("");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    } catch (err: any) {
      toast({
        title: "Failed to create table",
        description: err?.message,
        variant: "error",
      });
    }
  }

  async function handleRotateToken(tableId: string, tableLabel: string) {
    try {
      await apiFetch(`/tables/${tableId}`, {
        method: "PATCH",
        body: JSON.stringify({ rotateToken: true }),
      });
      toast({
        title: `Rotated QR token & PIN for ${tableLabel}`,
        description: "Previous QR links for this table are now invalidated.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    } catch (err: any) {
      toast({
        title: "Rotation failed",
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
            Dining Tables & QR Code Studio
          </h2>
          <p className="text-xs text-[#4A5950]">
            Occupancy reflects only active running orders (completed orders
            never mark a table occupied). Note: A QR code identifies the table
            token, not physical GPS proof.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPrintMode((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#0F291E] hover:bg-[#F2EFE9]"
          >
            <Printer className="h-4 w-4 text-[#D97706]" />
            {printMode ? "Exit Printable Sheet" : "Printable QR Tent Sheet"}
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F291E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#163829]"
          >
            <Plus className="h-4 w-4 text-[#84CC16]" />
            Add Table
          </button>
        </div>
      </div>

      {printMode && (
        <div className="rounded-2xl border border-[#0F291E] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
            <div>
              <h3 className="font-display font-bold text-lg text-[#0F291E]">
                Printable Table Tent QR Sheet — {restaurant?.name}
              </h3>
              <p className="text-xs text-[#718077]">
                Use your browser Print dialog (Ctrl+P / Cmd+P) to print acrylic
                table tents.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-[#0F291E] px-4 py-2 text-xs font-semibold text-white"
            >
              Print Sheet Now
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {tables.map((t: any) => {
              const fullUrl = `${origin}${t.qrPath}`;
              return (
                <div
                  key={t._id}
                  className="rounded-2xl border-2 border-[#0F291E] p-5 text-center space-y-2.5 flex flex-col items-center"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#286249]">
                    {restaurant?.name}
                  </span>
                  <h4 className="font-display font-bold text-xl text-[#0F291E]">
                    Table {t.label}
                  </h4>
                  <div className="p-2 bg-white rounded-xl border border-[#E5E0D5]">
                    <QRCodeCanvas value={fullUrl} size={132} />
                  </div>
                  <p className="text-[11px] font-mono text-[#4A5950]">
                    Table PIN: <strong>{t.sessionPin}</strong>
                  </p>
                  <p className="text-[10px] text-[#718077]">
                    Scan to browse menu & place order
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-white border border-[#E5E0D5] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tables.map((table: any) => {
            const fullUrl = `${origin}${table.qrPath}`;
            return (
              <div
                key={table._id}
                className={`rounded-2xl border bg-white p-5 shadow-card flex flex-col justify-between space-y-4 ${
                  table.isOccupied
                    ? "border-amber-400 ring-1 ring-amber-300"
                    : "border-[#E5E0D5]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-xl text-[#0F291E]">
                        {table.label}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          table.isOccupied
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {table.isOccupied ? "OCCUPIED" : "AVAILABLE"}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A5950] flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {table.capacity} Seats • {table.zone}
                    </p>
                    <p className="text-[11px] font-mono text-[#718077]">
                      Session PIN: <strong>{table.sessionPin}</strong>
                    </p>
                  </div>

                  <div className="p-2 rounded-xl border border-[#E5E0D5] bg-[#FBF9F5]">
                    <QRCodeCanvas value={fullUrl} size={76} />
                  </div>
                </div>

                {table.activeOrderSummary ? (
                  <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-amber-950">
                      <span>
                        Running Order: {table.activeOrderSummary.orderNumber}
                      </span>
                      <span className="font-mono">
                        {formatINR(table.activeOrderSummary.totalPaise)}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900">
                      Status: {table.activeOrderSummary.status} •{" "}
                      {table.activeOrderSummary.kotCount} KOT batch(es)
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#FBF9F5] border border-[#E5E0D5] p-3 text-xs text-[#718077]">
                    No active order on this table. Ready for next guest seating.
                  </div>
                )}

                <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-between gap-2">
                  <Link
                    href={table.qrPath}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F291E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#163829]"
                  >
                    <QrCode className="h-3.5 w-3.5 text-[#84CC16]" />
                    Open Guest QR Link
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleRotateToken(table._id, table.label)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E5E0D5] px-2.5 py-1.5 text-[11px] font-semibold text-[#4A5950] hover:text-[#0F291E]"
                    title="Rotate QR Token & Session PIN"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Rotate QR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E0D5] p-6 shadow-editorial space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0F291E]">
              Create Dining Table & QR Token
            </h3>
            <form onSubmit={handleCreateTable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Table Label *
                </label>
                <input
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="T-07"
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Dining Zone
                  </label>
                  <input
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded-xl border border-[#E5E0D5] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F291E] px-4 py-2 text-xs font-semibold text-white"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
