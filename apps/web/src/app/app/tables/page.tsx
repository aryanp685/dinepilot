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
  Copy,
  Check,
} from "lucide-react";
import { formatINR } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useAuth, useToast } from "@/providers/AppProviders";
import {
  PageHeader,
  StatusPill,
  AccessibleModal,
  EmptyStateCard,
} from "@/components/ui/DesignSystem";

export default function TablesAndQrPage() {
  const queryClient = useQueryClient();
  const { restaurant } = useAuth();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [previewTable, setPreviewTable] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [zone, setZone] = useState("Indoor AC Dining");
  const [capacity, setCapacity] = useState("4");

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: () => apiFetch("/tables"),
  });

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

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

  function handleCopyUrl(table: any) {
    const fullUrl = `${origin}${table.qrPath}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedId(table._id);
      toast({
        title: `Copied QR link for Table ${table.label}`,
        variant: "success",
      });
      setTimeout(() => setCopiedId(null), 1800);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Floor Plan & QR Code Studio"
        title="Table & Floor Management"
        subtitle="Generate table-specific QR codes, preview and print acrylic table tents, and monitor live active-order table occupancy."
        actions={
          <>
            <button
              type="button"
              onClick={() => setPrintMode((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#121715] hover:bg-[#F8F7F3] transition-colors"
            >
              <Printer className="h-4 w-4 text-[#176B52]" />
              {printMode ? "Exit Printable Sheet" : "Print All Table QR Tents"}
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541] shadow-card transition-colors"
            >
              <Plus className="h-4 w-4 text-[#20A67A]" />
              Add Dining Table
            </button>
          </>
        }
      />

      {printMode && (
        <div className="rounded-2xl border border-[#176B52] bg-white p-6 space-y-4 shadow-editorial">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3.5">
            <div>
              <h3 className="font-display font-bold text-lg text-[#121715]">
                Printable Table Tent QR Sheet — {restaurant?.name}
              </h3>
              <p className="text-xs text-[#64748B]">
                Use your browser Print dialog (Ctrl+P / Cmd+P) to print acrylic
                table tents for your dining room.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white hover:bg-[#125541]"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Sheet Now
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {tables.map((t: any) => {
              const fullUrl = `${origin}${t.qrPath}`;
              return (
                <div
                  key={t._id}
                  className="rounded-2xl border-2 border-[#176B52] p-5 text-center space-y-2.5 flex flex-col items-center bg-[#F8F7F3]/40"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B52]">
                    {restaurant?.name}
                  </span>
                  <h4 className="font-display font-bold text-xl text-[#121715]">
                    Table {t.label}
                  </h4>
                  <div className="p-2.5 bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
                    <QRCodeCanvas value={fullUrl} size={132} />
                  </div>
                  <p className="text-[11px] font-mono text-[#121715]">
                    Table PIN: <strong>{t.sessionPin}</strong>
                  </p>
                  <p className="text-[10px] text-[#64748B]">
                    Scan with phone camera to view menu & order
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
              className="h-56 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse"
            />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <EmptyStateCard
          icon={<QrCode className="h-5 w-5" />}
          title="No dining tables configured yet"
          description="Add your first dining table to generate a table-specific QR code and session PIN."
          action={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white"
            >
              Add First Table
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tables.map((table: any) => {
            const fullUrl = `${origin}${table.qrPath}`;
            return (
              <div
                key={table._id}
                className={`rounded-2xl border bg-white p-5 shadow-card flex flex-col justify-between space-y-4 transition-shadow hover:shadow-editorial ${
                  table.isOccupied
                    ? "border-amber-400 ring-1 ring-amber-300"
                    : "border-[#E5E7EB]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-xl text-[#121715]">
                        {table.label}
                      </span>
                      <StatusPill
                        tone={table.isOccupied ? "amber" : "emerald"}
                        pulse={table.isOccupied}
                      >
                        {table.isOccupied ? "OCCUPIED" : "AVAILABLE"}
                      </StatusPill>
                    </div>
                    <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#176B52]" />
                      {table.capacity} Seats • {table.zone}
                    </p>
                    <p className="text-[11px] font-mono text-[#64748B]">
                      Session PIN:{" "}
                      <strong className="text-[#121715]">
                        {table.sessionPin}
                      </strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewTable(table)}
                    title="Click to preview & print QR tent"
                    className="p-2 rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] hover:border-[#176B52] transition-colors group"
                  >
                    <QRCodeCanvas value={fullUrl} size={74} />
                    <span className="block text-[9px] font-semibold text-[#176B52] mt-1 group-hover:underline">
                      Preview QR
                    </span>
                  </button>
                </div>

                {table.activeOrderSummary ? (
                  <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3 text-xs space-y-1">
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
                  <div className="rounded-xl bg-[#F8F7F3] border border-[#E5E7EB] p-3 text-xs text-[#64748B]">
                    No active order on this table. Ready for next guest seating.
                  </div>
                )}

                <div className="pt-2.5 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={table.qrPath}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#176B52] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#125541]"
                    >
                      Open QR Menu
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPreviewTable(table)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F8F7F3] px-2.5 py-1.5 text-xs font-semibold text-[#121715] hover:bg-[#E8F3EF]"
                    >
                      <QrCode className="h-3.5 w-3.5 text-[#176B52]" />
                      QR Tent
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRotateToken(table._id, table.label)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-[11px] font-semibold text-[#64748B] hover:text-[#121715] hover:bg-[#F8F7F3]"
                    title="Rotate QR token & session PIN"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Rotate PIN
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AccessibleModal
        open={Boolean(previewTable)}
        onClose={() => setPreviewTable(null)}
        title={
          previewTable
            ? `Table ${previewTable.label} — QR Tent Preview & Print`
            : "QR Preview"
        }
        subtitle="Print this standalone table tent or copy the verified guest ordering link."
        maxWidthClass="max-w-md"
      >
        {previewTable && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-[#176B52] bg-[#F8F7F3] p-6 text-center space-y-3 flex flex-col items-center">
              <span className="rounded-md bg-[#E8F3EF] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#176B52]">
                {restaurant?.name || "DinePilot Restaurant"}
              </span>
              <h4 className="font-display font-bold text-2xl text-[#121715]">
                Table {previewTable.label}
              </h4>
              <p className="text-xs text-[#64748B]">
                {previewTable.zone} • {previewTable.capacity} Seats
              </p>
              <div className="p-3 bg-white rounded-2xl border border-[#E5E7EB] shadow-card">
                <QRCodeCanvas
                  value={`${origin}${previewTable.qrPath}`}
                  size={180}
                />
              </div>
              <div className="font-mono text-xs text-[#121715] bg-white border border-[#E5E7EB] rounded-lg px-3 py-1">
                Session PIN: <strong>{previewTable.sessionPin}</strong>
              </div>
              <p className="text-[11px] text-[#64748B] max-w-xs">
                Point your phone camera at this QR code to browse our live menu
                and place your order.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleCopyUrl(previewTable)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-semibold text-[#121715] hover:bg-[#F8F7F3]"
              >
                {copiedId === previewTable._id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#20A67A]" />
                    Copied Link
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy QR Link
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3.5 py-2 text-xs font-semibold text-[#121715] hover:bg-[#E8F3EF]"
                >
                  <Printer className="h-3.5 w-3.5 text-[#176B52]" />
                  Print Tent
                </button>
                <Link
                  href={previewTable.qrPath}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white hover:bg-[#125541]"
                >
                  Test QR Menu
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </AccessibleModal>

      <AccessibleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Dining Table"
        subtitle="Creates a unique cryptographic QR token and session PIN for this table."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleCreateTable} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#121715] mb-1">
              Table Label *
            </label>
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="T-07"
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3.5 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121715] mb-1">
              Dining Zone
            </label>
            <input
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Indoor AC Dining"
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3.5 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121715] mb-1">
              Seating Capacity
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3.5 py-2 text-xs font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-[#121715]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white hover:bg-[#125541]"
            >
              Create Table & QR
            </button>
          </div>
        </form>
      </AccessibleModal>
    </div>
  );
}
