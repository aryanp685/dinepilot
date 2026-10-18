"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  CheckCircle2,
  ExternalLink,
  Layers,
  ChefHat,
  Utensils,
} from "lucide-react";
import {
  formatINR,
  getNextAllowedOrderStatuses,
  OrderStatus,
  OrderType,
} from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/AppProviders";
import {
  PageHeader,
  StatusPill,
  OrderLifecyclePipeline,
  AccessibleModal,
  EmptyStateCard,
} from "@/components/ui/DesignSystem";

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [posOpen, setPosOpen] = useState(false);

  const [posOrderType, setPosOrderType] = useState<OrderType>("DINE_IN");
  const [posTableId, setPosTableId] = useState("");
  const [posAppendOrderId, setPosAppendOrderId] = useState("");
  const [posCustomerName, setPosCustomerName] = useState("");
  const [posCustomerPhone, setPosCustomerPhone] = useState("");
  const [posNotes, setPosNotes] = useState("");
  const [posCart, setPosCart] = useState<
    Array<{
      menuItemId: string;
      name: string;
      pricePaise: number;
      quantity: number;
    }>
  >([]);
  const [submittingPos, setSubmittingPos] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", statusFilter, typeFilter, search],
    queryFn: () =>
      apiFetch(
        `/orders?status=${statusFilter}&orderType=${typeFilter}&search=${encodeURIComponent(
          search
        )}`
      ),
  });

  const { data: menuData } = useQuery({
    queryKey: ["menu"],
    queryFn: () => apiFetch("/menu"),
  });

  const { data: tables = [] } = useQuery({
    queryKey: ["tables"],
    queryFn: () => apiFetch("/tables"),
  });

  async function handleStatusTransition(orderId: string, toStatus: OrderStatus) {
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: toStatus }),
      });
      toast({
        title: `Order transitioned to ${toStatus}`,
        description:
          toStatus === "ACCEPTED"
            ? "Recipe ingredients automatically deducted from inventory."
            : undefined,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    } catch (err: any) {
      toast({
        title: "Status transition rejected",
        description: err?.message || "Invalid transition",
        variant: "error",
      });
    }
  }

  async function handleVerifyPayment(
    orderId: string,
    method: "UPI" | "CASH" | "CARD",
    action: "MARK_PAID" | "MARK_REFUNDED" = "MARK_PAID"
  ) {
    try {
      await apiFetch("/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          method,
          action,
          idempotencyKey: `staff-pay-${orderId}-${action}-${Date.now()}`,
        }),
      });
      toast({
        title:
          action === "MARK_REFUNDED"
            ? "Order marked as REFUNDED"
            : `Payment verified (${method})`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (err: any) {
      toast({
        title: "Payment update failed",
        description: err?.message,
        variant: "error",
      });
    }
  }

  function addItemToPosCart(item: any) {
    setPosCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          pricePaise: item.pricePaise,
          quantity: 1,
        },
      ];
    });
  }

  async function submitPosOrder(e: React.FormEvent) {
    e.preventDefault();
    if (posCart.length === 0) return;
    setSubmittingPos(true);
    try {
      const created = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          orderType: posOrderType,
          tableId:
            posOrderType === "DINE_IN" && posTableId ? posTableId : undefined,
          appendToRunningOrderId: posAppendOrderId || undefined,
          customerName: posCustomerName || undefined,
          customerPhone: posCustomerPhone || undefined,
          customerNotes: posNotes || undefined,
          idempotencyKey: `pos-${Date.now()}`,
          items: posCart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
            selectedModifiers: [],
          })),
        }),
      });
      toast({
        title: posAppendOrderId
          ? `Added new KOT to Order ${created.orderNumber}`
          : `Created Order ${created.orderNumber}`,
        description: `Server-calculated GST Total: ${formatINR(
          created.totalPaise
        )}`,
        variant: "success",
      });
      setPosCart([]);
      setPosAppendOrderId("");
      setPosCustomerName("");
      setPosCustomerPhone("");
      setPosNotes("");
      setPosOpen(false);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    } catch (err: any) {
      toast({
        title: "Could not create order",
        description: err?.message,
        variant: "error",
      });
    } finally {
      setSubmittingPos(false);
    }
  }

  const activeRunningOrders = orders.filter((o: any) =>
    ["NEW", "ACCEPTED", "PREPARING", "READY"].includes(o.status)
  );

  function statusTone(status: string) {
    if (status === "NEW") return "amber";
    if (status === "ACCEPTED" || status === "PREPARING") return "blue";
    if (status === "READY" || status === "COMPLETED") return "emerald";
    if (status === "CANCELLED") return "crimson";
    return "neutral";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live Service Queue & Staff POS Fallback"
        title="Live Order Management & Running KOTs"
        subtitle="Manage incoming QR orders, advance kitchen states (NEW → ACCEPTED → PREPARING → READY → COMPLETED), or create waiter-assisted orders."
        actions={
          <>
            <Link
              href="/kitchen"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#121715] hover:bg-[#F8F7F3] transition-colors"
            >
              <ChefHat className="h-4 w-4 text-[#176B52]" />
              Kitchen Display (KDS)
            </Link>
            <button
              type="button"
              onClick={() => setPosOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541] shadow-card transition-colors"
            >
              <Plus className="h-4 w-4 text-[#20A67A]" />
              New Staff POS Order / Add KOT
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            "ALL",
            "ACTIVE",
            "NEW",
            "ACCEPTED",
            "PREPARING",
            "READY",
            "COMPLETED",
            "CANCELLED",
          ].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-[#176B52] text-white"
                  : "bg-[#F8F7F3] text-[#64748B] hover:text-[#121715]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by order type"
            className="rounded-lg border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-1.5 text-xs font-semibold text-[#121715]"
          >
            <option value="ALL">All Order Types</option>
            <option value="DINE_IN">Dine-In</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
          </select>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[#64748B] absolute left-3 top-2.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order # (e.g. DP-1010)"
              className="rounded-lg border border-[#E5E7EB] bg-[#F8F7F3] pl-8 pr-3 py-1.5 text-xs w-48 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyStateCard
          icon={<Utensils className="h-5 w-5" />}
          title="No orders match the current filter"
          description="Switch status filters, scan a table QR code, or create a waiter-assisted order using the Staff POS button."
          action={
            <button
              type="button"
              onClick={() => setPosOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white hover:bg-[#125541]"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Staff POS Order
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const nextStatuses = getNextAllowedOrderStatuses(
              order.status as OrderStatus
            );
            return (
              <div
                key={order._id}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-card space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E7EB] pb-3.5">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-base text-[#121715]">
                        {order.orderNumber}
                      </span>
                      <StatusPill tone="forest">
                        {order.tableLabelSnapshot
                          ? `Table ${order.tableLabelSnapshot}`
                          : order.orderType}
                      </StatusPill>
                      <StatusPill tone="neutral">{order.source}</StatusPill>
                      {order.kotBatches?.length > 1 && (
                        <StatusPill tone="purple">
                          <Layers className="h-3 w-3" />
                          {order.kotBatches.length} KOT Batches
                        </StatusPill>
                      )}
                      <StatusPill tone={statusTone(order.status)} pulse={order.status === "NEW"}>
                        {order.status}
                      </StatusPill>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Guest: <strong className="text-[#121715]">{order.customerName || "Walk-in"}</strong>{" "}
                      {order.customerPhone ? `(${order.customerPhone})` : ""} •
                      Placed {new Date(order.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <OrderLifecyclePipeline status={order.status} compact />
                    <Link
                      href={`/order/${order.publicOrderToken}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F8F7F3] px-2.5 py-1.5 text-xs font-semibold text-[#121715] hover:bg-[#E8F3EF]"
                    >
                      Guest Tracker
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <div className="lg:col-span-7 space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-[#F8F7F3] rounded-xl px-3.5 py-2.5 border border-[#E5E7EB]"
                      >
                        <div>
                          <span className="font-bold text-[#121715]">
                            {item.quantity}× {item.nameSnapshot}
                          </span>
                          <span className="ml-2 rounded bg-white border border-[#E5E7EB] px-1.5 py-0.5 text-[10px] font-mono text-[#176B52] font-semibold">
                            KOT #{item.kotNumber || 1}
                          </span>
                          {item.modifiers?.length > 0 && (
                            <span className="block text-[11px] text-[#64748B] mt-0.5">
                              Modifiers:{" "}
                              {item.modifiers
                                .map((m: any) => m.optionName)
                                .join(", ")}
                            </span>
                          )}
                          {item.notes && (
                            <span className="block text-[11px] text-amber-800 mt-0.5">
                              Note: {item.notes}
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-[#121715]">
                          {formatINR(item.lineSubtotalPaise)}
                        </span>
                      </div>
                    ))}
                    {order.customerNotes && (
                      <p className="text-xs text-amber-900 bg-amber-50 rounded-xl px-3.5 py-2 border border-amber-200">
                        <strong>Order Notes:</strong> {order.customerNotes}
                      </p>
                    )}
                  </div>

                  <div className="lg:col-span-5 rounded-xl bg-[#F8F7F3] border border-[#E5E7EB] p-4 space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#64748B]">
                      <span>Items Subtotal</span>
                      <span className="font-mono">
                        {formatINR(order.subtotalPaise)}
                      </span>
                    </div>
                    {order.packagingTotalPaise > 0 && (
                      <div className="flex justify-between text-[#64748B]">
                        <span>Packaging Charge</span>
                        <span className="font-mono">
                          {formatINR(order.packagingTotalPaise)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#64748B]">
                      <span>CGST + SGST ({order.taxModeSnapshot})</span>
                      <span className="font-mono">
                        {formatINR(order.cgstPaise + order.sgstPaise)}
                      </span>
                    </div>
                    {order.roundOffPaise !== 0 && (
                      <div className="flex justify-between text-[#64748B]">
                        <span>Rupee Round-Off</span>
                        <span className="font-mono">
                          {order.roundOffPaise > 0 ? "+" : ""}
                          {(order.roundOffPaise / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-[#121715] pt-2 border-t border-[#E5E7EB]">
                      <span>Grand Total</span>
                      <span className="font-mono text-[#176B52]">
                        {formatINR(order.totalPaise)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <StatusPill
                        tone={
                          order.paymentStatus === "PAID"
                            ? "emerald"
                            : order.paymentStatus === "PENDING_VERIFICATION"
                            ? "amber"
                            : "neutral"
                        }
                      >
                        Payment: {order.paymentStatus}
                        {order.paymentReference
                          ? ` (${order.paymentReference})`
                          : ""}
                      </StatusPill>
                      <span className="text-[11px] text-[#64748B] font-medium">
                        Recipe Stock Deducted:{" "}
                        <strong className="text-[#121715]">
                          {order.inventoryConsumed ? "Yes" : "No"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#E5E7EB]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#64748B]">
                      Next Action:
                    </span>
                    {nextStatuses.length === 0 ? (
                      <span className="text-xs text-[#64748B] italic">
                        Terminal state ({order.status})
                      </span>
                    ) : (
                      nextStatuses.map((nextSt) => (
                        <button
                          key={nextSt}
                          type="button"
                          onClick={() =>
                            handleStatusTransition(order._id, nextSt)
                          }
                          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            nextSt === "CANCELLED"
                              ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-[#176B52] text-white hover:bg-[#125541]"
                          }`}
                        >
                          Move to {nextSt}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.paymentStatus !== "PAID" &&
                      order.status !== "CANCELLED" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleVerifyPayment(order._id, "UPI", "MARK_PAID")
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-[#20A67A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#176B52]"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verify UPI Paid
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleVerifyPayment(
                                order._id,
                                "CASH",
                                "MARK_PAID"
                              )
                            }
                            className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#121715] hover:bg-[#F8F7F3]"
                          >
                            Mark Cash Paid
                          </button>
                        </>
                      )}
                    {order.paymentStatus === "PAID" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleVerifyPayment(order._id, "UPI", "MARK_REFUNDED")
                        }
                        className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                      >
                        Record Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AccessibleModal
        open={posOpen}
        onClose={() => setPosOpen(false)}
        title="Staff-Assisted POS Order / Running Table KOT"
        subtitle="Waiter & cashier fallback when guests order verbally. Item prices and GST are recalculated on the server."
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={submitPosOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#121715] mb-1">
                Order Type
              </label>
              <select
                value={posOrderType}
                onChange={(e) => setPosOrderType(e.target.value as OrderType)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-2 text-xs font-semibold"
              >
                <option value="DINE_IN">Dine-In</option>
                <option value="TAKEAWAY">Takeaway</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>

            {posOrderType === "DINE_IN" && (
              <div>
                <label className="block text-xs font-semibold text-[#121715] mb-1">
                  Select Table
                </label>
                <select
                  value={posTableId}
                  onChange={(e) => setPosTableId(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-2 text-xs"
                >
                  <option value="">Walk-in / Counter</option>
                  {tables.map((t: any) => (
                    <option key={t._id} value={t._id}>
                      {t.label} ({t.zone}) {t.isOccupied ? "• Occupied" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#121715] mb-1">
                Append KOT to Running Order?
              </label>
              <select
                value={posAppendOrderId}
                onChange={(e) => setPosAppendOrderId(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-2 text-xs"
              >
                <option value="">Create New Order</option>
                {activeRunningOrders.map((ro: any) => (
                  <option key={ro._id} value={ro._id}>
                    Append to {ro.orderNumber} (
                    {ro.tableLabelSnapshot || ro.orderType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={posCustomerName}
              onChange={(e) => setPosCustomerName(e.target.value)}
              placeholder="Guest Name (Optional)"
              className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3.5 py-2 text-xs"
            />
            <input
              value={posCustomerPhone}
              onChange={(e) => setPosCustomerPhone(e.target.value)}
              placeholder="Guest Phone for Loyalty (Optional)"
              className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3.5 py-2 text-xs"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#121715]">
              Tap Menu Items to Add to Ticket:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1">
              {(menuData?.items || [])
                .filter((i: any) => i.isAvailable)
                .map((item: any) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => addItemToPosCart(item)}
                    className="text-left rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] hover:bg-[#E8F3EF] hover:border-[#176B52]/30 p-3 transition-colors"
                  >
                    <p className="text-xs font-bold text-[#121715] truncate">
                      {item.name}
                    </p>
                    <p className="font-mono text-[11px] text-[#176B52] font-semibold mt-0.5">
                      {formatINR(item.pricePaise)}
                    </p>
                  </button>
                ))}
            </div>
          </div>

          {posCart.length > 0 && (
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] p-3.5 space-y-2">
              {posCart.map((c) => (
                <div
                  key={c.menuItemId}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-[#121715]">
                    {c.quantity}× {c.name}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-semibold text-[#121715]">
                      {formatINR(c.pricePaise * c.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPosCart((prev) =>
                          prev.filter((i) => i.menuItemId !== c.menuItemId)
                        )
                      }
                      className="text-red-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <input
            value={posNotes}
            onChange={(e) => setPosNotes(e.target.value)}
            placeholder="Kitchen preparation notes (e.g., Less oil, Jain prep)"
            className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3.5 py-2 text-xs"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPosOpen(false)}
              className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-[#121715] hover:bg-[#F8F7F3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPos || posCart.length === 0}
              className="rounded-xl bg-[#176B52] px-5 py-2 text-xs font-semibold text-white hover:bg-[#125541] disabled:opacity-50"
            >
              {submittingPos
                ? "Submitting..."
                : posAppendOrderId
                ? "Append KOT Batch"
                : "Create POS Order"}
            </button>
          </div>
        </form>
      </AccessibleModal>
    </div>
  );
}
