"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Clock,
  Utensils,
  PlusCircle,
  Smartphone,
  Star,
  AlertCircle,
} from "lucide-react";
import { formatINR } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useToast } from "@/providers/AppProviders";

const STATUS_STEPS = [
  { id: "NEW", label: "Order Sent" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "PREPARING", label: "Preparing" },
  { id: "READY", label: "Ready to Serve" },
  { id: "SERVED", label: "Served" },
  { id: "COMPLETED", label: "Completed" },
];

export default function PublicOrderTrackerPage() {
  const params = useParams<{ publicOrderToken: string }>();
  const publicOrderToken =
    params?.publicOrderToken || "ord_demo_preparing_1010";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-order", publicOrderToken],
    queryFn: () => apiFetch(`/public/orders/${publicOrderToken}`),
    refetchInterval: 10000,
  });

  useEffect(() => {
    const socket = getSocket();
    socket.emit("join:public-order", publicOrderToken);

    const onUpdated = (payload: any) => {
      queryClient.invalidateQueries({
        queryKey: ["public-order", publicOrderToken],
      });
      toast({
        title: `Live Order Update: ${payload.status}`,
        description: `Payment status: ${payload.paymentStatus}`,
        variant: "success",
      });
    };

    socket.on("public:order-updated", onUpdated);
    return () => {
      socket.off("public:order-updated", onUpdated);
    };
  }, [publicOrderToken, queryClient, toast]);

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch(`/public/orders/${publicOrderToken}/feedback`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      });
      setFeedbackSent(true);
      toast({
        title: "Thank you for your dining feedback!",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Feedback submission failed",
        description: err?.message,
        variant: "error",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-6">
        <p className="text-xs font-medium text-[#64748B]">
          Connecting to live kitchen order tracker...
        </p>
      </div>
    );
  }

  if (error || !data?.order) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-[#101820]">
            Order Token Not Found
          </h1>
          <p className="text-xs text-[#64748B]">
            Could not locate order token <code>{publicOrderToken}</code>.
          </p>
          <Link
            href="/order/ord_demo_preparing_1010"
            className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white"
          >
            View Live Sample Order #DP-1010
          </Link>
        </div>
      </div>
    );
  }

  const { order, restaurant, upiDeepLink } = data;
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.id === order.status);

  const kotBatches: Record<number, any[]> = {};
  for (const item of order.items || []) {
    const batch = item.kotBatch || 1;
    if (!kotBatches[batch]) kotBatches[batch] = [];
    kotBatches[batch].push(item);
  }

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#101820] pb-16">
      <header className="border-b border-[#E5E7EB] bg-[#176B52] text-white">
        <div className="mx-auto max-w-2xl px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded bg-[#163829] border border-[#20A67A]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#20A67A] uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-[#20A67A] animate-pulse" />
              Live Kitchen Tracker • {order.orderType.replace("_", "-")}
            </span>
            <h1 className="font-display text-2xl font-bold mt-1">
              {order.orderNumber} {order.tableLabel ? `• Table ${order.tableLabel}` : ""}
            </h1>
            <p className="text-xs text-[#E6ECE8]/80">
              {restaurant?.name || "Saoji Spice Kitchen"} • {order.kotCount || 1}{" "}
              KOT Batch(es)
            </p>
          </div>

          {restaurant?.slug &&
            order.status !== "COMPLETED" &&
            order.status !== "CANCELLED" && (
              <Link
                href={`/menu/${restaurant.slug}?table=tbl_saoji_t01&appendOrder=${order.publicOrderToken}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#20A67A] px-3.5 py-2.5 text-xs font-bold text-[#101820] hover:bg-[#198763]"
              >
                <PlusCircle className="h-4 w-4" />
                Order More (Next KOT)
              </Link>
            )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-[#101820]">
              Real-Time Kitchen Status
            </h2>
            <span className="rounded-full bg-[#E8F3EF] px-3 py-1 font-mono text-xs font-bold text-[#101820]">
              {order.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
            {STATUS_STEPS.map((step, idx) => {
              const reached = currentStepIdx >= idx;
              return (
                <div
                  key={step.id}
                  className={`rounded-xl border p-2.5 text-center space-y-1 ${
                    reached
                      ? "border-[#176B52] bg-[#E8F3EF]/60 text-[#101820]"
                      : "border-[#E5E7EB] bg-[#F8F7F3] text-[#64748B]"
                  }`}
                >
                  <div className="flex justify-center">
                    {reached ? (
                      <CheckCircle2 className="h-4 w-4 text-[#101820]" />
                    ) : (
                      <Clock className="h-4 w-4 text-[#64748B]" />
                    )}
                  </div>
                  <p className="text-[11px] font-bold">{step.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h2 className="font-display font-bold text-base text-[#101820] flex items-center gap-2">
              <Utensils className="h-4 w-4 text-[#101820]" />
              Kitchen Order Tickets (KOT Batches)
            </h2>
            <span className="text-xs text-[#64748B]">
              Running Table Session
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(kotBatches).map(([batchNum, batchItems]) => (
              <div
                key={batchNum}
                className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#176B52] px-2.5 py-0.5 font-mono text-[11px] font-bold text-white">
                    KOT Batch #{batchNum}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    {batchItems.length} Dish Line(s)
                  </span>
                </div>
                <div className="divide-y divide-[#E5E7EB] text-xs">
                  {batchItems.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="py-2 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#101820]">
                          {item.quantity}×
                        </span>{" "}
                        <span className="font-semibold text-[#101820]">
                          {item.name}
                        </span>
                        {item.variantName && (
                          <span className="text-[#64748B]">
                            {" "}
                            ({item.variantName})
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-[#101820]">
                        {formatINR(item.lineTotalPaise)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E5E7EB] pt-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-[#64748B]">
              <span>Subtotal</span>
              <span className="font-mono">{formatINR(order.subtotalPaise)}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>CGST + SGST</span>
              <span className="font-mono">
                {formatINR(order.cgstPaise + order.sgstPaise)}
              </span>
            </div>
            {order.packagingFeePaise > 0 && (
              <div className="flex justify-between text-[#64748B]">
                <span>Packaging Fee</span>
                <span className="font-mono">
                  {formatINR(order.packagingFeePaise)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-[#101820] pt-2 border-t border-[#E5E7EB]">
              <span>Grand Total</span>
              <span className="font-mono">
                {formatINR(order.totalAmountPaise)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-[#101820] flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[#C6A15B]" />
              Payment & Verification Status
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                order.paymentStatus === "PAID"
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>

          {order.paymentStatus !== "PAID" && upiDeepLink && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] p-4">
              <div className="flex justify-center bg-white p-3 rounded-xl border border-[#E5E7EB]">
                <QRCodeSVG value={upiDeepLink} size={120} />
              </div>
              <div className="sm:col-span-2 space-y-2 text-xs">
                <p className="font-bold text-[#101820]">
                  Scan with GPay, PhonePe, or Paytm ({restaurant?.upiVpa})
                </p>
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-amber-900 text-[11px]">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    UPI deep-links provide payment instructions only. Your
                    payment status remains{" "}
                    <strong>PENDING_VERIFICATION</strong> until verified by the
                    restaurant cashier or signed webhook.
                  </span>
                </div>
                <a
                  href={upiDeepLink}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white"
                >
                  Open UPI App ({formatINR(order.totalAmountPaise)})
                </a>
              </div>
            </div>
          )}
        </div>

        {!feedbackSent ? (
          <form
            onSubmit={handleSubmitFeedback}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4"
          >
            <h2 className="font-display font-bold text-base text-[#101820]">
              Rate Your Dining Experience
            </h2>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-stone-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell the chef what you loved..."
              className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-xs"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white"
            >
              Submit Guest Review
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-xs font-semibold text-emerald-900">
            Thank you! Your feedback has been recorded on your guest loyalty
            profile.
          </div>
        )}
      </main>
    </div>
  );
}
