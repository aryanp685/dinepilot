"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChefHat,
  Clock,
  Flame,
  ArrowLeft,
  CheckCircle2,
  Volume2,
  RefreshCw,
} from "lucide-react";
import { OrderStatus } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth, useToast } from "@/providers/AppProviders";

export default function KitchenDisplaySystemPage() {
  const { user, restaurant, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [nowTick, setNowTick] = useState(Date.now());
  const [filterStatus, setFilterStatus] = useState<string>("ALL_ACTIVE");

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const { data: activeOrders = [], isLoading } = useQuery({
    queryKey: ["orders", "active"],
    queryFn: () => apiFetch("/orders?activeOnly=true"),
    enabled: Boolean(user),
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!restaurant?.id) return;
    const socket = getSocket();
    socket.emit("join:restaurant", restaurant.id);

    const refresh = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: `KDS Alert: ${payload?.orderNumber || "Order Updated"}`,
        description: payload?.status
          ? `Status: ${payload.status}`
          : "New KOT batch received!",
        variant: "success",
      });
    };

    socket.on("order:created", refresh);
    socket.on("order:kot-added", refresh);
    socket.on("order:status-updated", refresh);

    return () => {
      socket.off("order:created", refresh);
      socket.off("order:kot-added", refresh);
      socket.off("order:status-updated", refresh);
    };
  }, [restaurant?.id, queryClient, toast]);

  async function handleAdvanceStatus(orderId: string, nextStatus: OrderStatus) {
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast({
        title: `Order moved to ${nextStatus}`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (err: any) {
      toast({
        title: "KDS transition error",
        description: err?.message,
        variant: "error",
      });
    }
  }

  const filtered = activeOrders.filter((ord: any) => {
    if (filterStatus === "ALL_ACTIVE") {
      return ["NEW", "ACCEPTED", "PREPARING", "READY"].includes(ord.status);
    }
    return ord.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-[#0C120E] text-[#F3F6F4] flex flex-col">
      <header className="border-b border-[#233529] bg-[#141F18] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-[#84CC16] text-[#0F291E] flex items-center justify-center font-bold">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold text-white">
                Kitchen Display System (KDS)
              </h1>
              <span className="rounded bg-[#0F291E] border border-[#84CC16]/40 px-2 py-0.5 font-mono text-[10px] font-bold text-[#84CC16]">
                LIVE SOCKET.IO SYNC
              </span>
            </div>
            <p className="text-xs text-[#9AB0A2]">
              {restaurant?.name || "Saoji Spice Kitchen"} • SLA Thresholds:
              &lt;10m On-Time • 10–20m Warning • &gt;20m Delayed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {["ALL_ACTIVE", "NEW", "ACCEPTED", "PREPARING", "READY"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                filterStatus === st
                  ? "bg-[#84CC16] text-[#0F291E]"
                  : "bg-[#0C120E] border border-[#233529] text-[#9AB0A2] hover:text-white"
              }`}
            >
              {st === "ALL_ACTIVE" ? "All Active Tickets" : st}
            </button>
          ))}

          <Link
            href="/app/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#233529] bg-[#0C120E] px-3.5 py-2 text-xs font-semibold text-[#E6ECE8] hover:bg-[#1A2920]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Order Desk
          </Link>
        </div>
      </header>

      <main className="flex-1 p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-[#141F18] border border-[#233529] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#233529] bg-[#141F18] p-16 text-center space-y-3 max-w-lg mx-auto my-12">
            <CheckCircle2 className="h-10 w-10 text-[#84CC16] mx-auto" />
            <h2 className="font-display text-xl font-bold text-white">
              All Kitchen Tickets Cleared!
            </h2>
            <p className="text-xs text-[#9AB0A2]">
              New QR table orders and staff KOT batches will appear here in real
              time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((ord: any) => {
              const elapsedMinutes = Math.max(
                0,
                Math.floor(
                  (nowTick - new Date(ord.placedAt).getTime()) / 60000
                )
              );

              const slaColor =
                elapsedMinutes >= 20
                  ? "border-red-500 bg-red-950/30"
                  : elapsedMinutes >= 10
                  ? "border-amber-500 bg-amber-950/20"
                  : "border-emerald-600/60 bg-[#141F18]";

              const timerBadge =
                elapsedMinutes >= 20
                  ? "bg-red-600 text-white"
                  : elapsedMinutes >= 10
                  ? "bg-amber-500 text-black"
                  : "bg-emerald-600 text-white";

              return (
                <div
                  key={ord._id}
                  className={`rounded-2xl border-2 p-5 flex flex-col justify-between space-y-4 ${slaColor}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-[#233529] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-bold text-white">
                            {ord.orderNumber}
                          </span>
                          <span className="rounded bg-[#84CC16] px-2.5 py-0.5 text-xs font-extrabold text-[#0F291E]">
                            {ord.tableLabel
                              ? `TABLE ${ord.tableLabel}`
                              : ord.orderType}
                          </span>
                          {ord.kotCount > 1 && (
                            <span className="rounded bg-amber-500/20 border border-amber-400 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                              {ord.kotCount} KOTs
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#9AB0A2] mt-1">
                          Guest: {ord.customerName}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${timerBadge}`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {elapsedMinutes}m
                        </span>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[#9AB0A2]">
                          {ord.status}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {ord.items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="rounded-xl bg-[#0C120E] border border-[#233529] p-3 space-y-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="h-6 w-6 rounded bg-[#233529] text-[#84CC16] font-mono font-bold text-xs flex items-center justify-center">
                                {item.quantity}×
                              </span>
                              <span className="font-bold text-sm text-white">
                                {item.name}
                              </span>
                            </div>
                            <span className="rounded bg-[#141F18] px-2 py-0.5 font-mono text-[10px] text-[#9AB0A2]">
                              KOT #{item.kotBatch || 1}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pl-8 text-[11px]">
                            {item.variantName && (
                              <span className="text-amber-300 font-semibold">
                                Portion: {item.variantName}
                              </span>
                            )}
                            {item.dietaryTag === "JAIN" && (
                              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300 font-bold">
                                JAIN PREP
                              </span>
                            )}
                            {item.spiceLevel === "SAOJI_FIERY" && (
                              <span className="inline-flex items-center gap-0.5 text-red-400 font-bold">
                                <Flame className="h-3 w-3" /> SAOJI FIERY
                              </span>
                            )}
                          </div>

                          {item.selectedAddons?.length > 0 && (
                            <p className="pl-8 text-[11px] text-[#9AB0A2]">
                              +{" "}
                              {item.selectedAddons
                                .map((a: any) => a.name)
                                .join(", ")}
                            </p>
                          )}

                          {item.notes && (
                            <p className="pl-8 text-xs font-bold text-amber-400">
                              Chef Note: “{item.notes}”
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {ord.specialInstructions && (
                      <div className="rounded-xl bg-amber-500/15 border border-amber-500/40 p-3 text-xs text-amber-300 font-semibold">
                        Order Instruction: {ord.specialInstructions}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#233529] grid grid-cols-1 gap-2">
                    {ord.status === "NEW" && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(ord._id, "ACCEPTED")}
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3.5 text-sm font-bold text-white shadow-lg"
                      >
                        Accept Order & Deduct Recipe Stock →
                      </button>
                    )}
                    {ord.status === "ACCEPTED" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAdvanceStatus(ord._id, "PREPARING")
                        }
                        className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-3.5 text-sm font-extrabold text-black shadow-lg"
                      >
                        Start Firing on Range (PREPARING) →
                      </button>
                    )}
                    {ord.status === "PREPARING" && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(ord._id, "READY")}
                        className="w-full rounded-xl bg-[#84CC16] hover:bg-[#9BE32B] py-3.5 text-sm font-extrabold text-[#0F291E] shadow-lg"
                      >
                        Mark Dish Ready for Pickup (READY) →
                      </button>
                    )}
                    {ord.status === "READY" && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(ord._id, "COMPLETED")}
                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg"
                      >
                        Confirm Served & Completed (COMPLETED) ✓
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
