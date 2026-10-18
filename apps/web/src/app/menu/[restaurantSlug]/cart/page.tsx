"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ReceiptIndianRupee,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import {
  calculateGstAndTotals,
  formatINR,
  OrderType,
  PaymentMethod,
} from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import {
  clearGuestCart,
  GuestCartLine,
  loadGuestCart,
  saveGuestCart,
} from "@/lib/guestCart";
import { useToast } from "@/providers/AppProviders";

function GuestCartCheckoutContent() {
  const params = useParams<{ restaurantSlug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const restaurantSlug = params?.restaurantSlug || "saoji-spice-nagpur";
  const tableQueryParam = searchParams?.get("table") || undefined;

  const [lines, setLines] = useState<GuestCartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [tableQrToken, setTableQrToken] = useState(
    tableQueryParam || "tbl_saoji_t01"
  );
  const [appendToOrderToken, setAppendToOrderToken] = useState("");
  const [customerName, setCustomerName] = useState("Guest Diner");
  const [customerPhone, setCustomerPhone] = useState("+91 9823011223");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("UPI");
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["public-menu", restaurantSlug, tableQrToken],
    queryFn: () =>
      apiFetch(
        `/public/menu/${restaurantSlug}${
          tableQrToken ? `?table=${encodeURIComponent(tableQrToken)}` : ""
        }`
      ),
  });

  useEffect(() => {
    const cart = loadGuestCart(restaurantSlug);
    setLines(cart.lines);
    if (tableQueryParam || cart.tableQrToken) {
      setTableQrToken(tableQueryParam || cart.tableQrToken || "tbl_saoji_t01");
    }
    if (cart.appendToOrderToken) {
      setAppendToOrderToken(cart.appendToOrderToken);
    }
  }, [restaurantSlug, tableQueryParam]);

  function updateQuantity(cartLineId: string, delta: number) {
    const updated = lines
      .map((l) =>
        l.cartLineId === cartLineId
          ? { ...l, quantity: Math.max(0, l.quantity + delta) }
          : l
      )
      .filter((l) => l.quantity > 0);
    setLines(updated);
    saveGuestCart({
      restaurantSlug,
      tableQrToken,
      appendToOrderToken: appendToOrderToken || undefined,
      lines: updated,
    });
  }

  const restaurant = data?.restaurant;
  const settings = restaurant?.settings || {
    taxMode: "TAX_EXCLUSIVE",
    cgstRateBps: 250,
    sgstRateBps: 250,
    serviceChargeRateBps: 0,
    defaultPackagingFeePaise: 1500,
    enableRoundOff: true,
  };

  const subtotalPaise = lines.reduce((acc, l) => {
    const addonSum = l.selectedAddons.reduce((s, a) => s + a.pricePaise, 0);
    return (
      acc + (l.basePricePaise + l.variantPriceDeltaPaise + addonSum) * l.quantity
    );
  }, 0);

  const packagingPaise =
    orderType === "TAKEAWAY" || orderType === "DELIVERY"
      ? lines.reduce(
          (acc, l) =>
            acc +
            (l.packagingFeePaise || settings.defaultPackagingFeePaise || 0) *
              l.quantity,
          0
        )
      : 0;

  const billPreview = calculateGstAndTotals({
    itemsSubtotalPaise: subtotalPaise,
    discountPaise: 0,
    packagingTotalPaise: packagingPaise,
    orderType,
    taxConfig: {
      taxMode: settings.taxMode,
      cgstRateBps: settings.cgstRateBps,
      sgstRateBps: settings.sgstRateBps,
      serviceChargeRateBps: settings.serviceChargeRateBps,
      defaultPackagingPaise: settings.defaultPackagingFeePaise,
      enableRoundOff: settings.enableRoundOff,
    },
  });

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;

    setSubmitting(true);
    try {
      const created = await apiFetch("/public/orders", {
        method: "POST",
        body: JSON.stringify({
          restaurantSlug,
          orderType,
          tableQrToken: orderType === "DINE_IN" ? tableQrToken : undefined,
          appendToOrderToken: appendToOrderToken || undefined,
          customerName,
          customerPhone,
          deliveryAddress:
            orderType === "DELIVERY" ? deliveryAddress : undefined,
          specialInstructions: specialInstructions || undefined,
          paymentMethod,
          idempotencyKey: `guest-order-${Date.now()}`,
          items: lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            variantName: l.variantName,
            selectedAddons: l.selectedAddons.map((a) => a.name),
            notes: l.notes,
          })),
        }),
      });

      clearGuestCart(restaurantSlug);
      toast({
        title: `Order ${created.orderNumber} sent to kitchen!`,
        description: `KOT Batch #${created.kotCount || 1} dispatched.`,
        variant: "success",
      });
      router.push(`/order/${created.publicOrderToken}`);
    } catch (err: any) {
      toast({
        title: "Order placement failed",
        description: err?.message,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#111C16] pb-16">
      <header className="border-b border-[#E5E0D5] bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link
            href={`/menu/${restaurantSlug}${
              tableQrToken ? `?table=${encodeURIComponent(tableQrToken)}` : ""
            }`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F291E] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {restaurant?.name || "Menu"}
          </Link>
          <span className="font-display font-bold text-sm text-[#0F291E]">
            Review Cart & GST Bill
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {lines.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E0D5] bg-white p-10 text-center space-y-3">
            <h1 className="font-display font-bold text-lg text-[#0F291E]">
              Your cart is empty
            </h1>
            <p className="text-xs text-[#4A5950]">
              Add authentic dishes from the digital QR menu to get started.
            </p>
            <Link
              href={`/menu/${restaurantSlug}${
                tableQrToken ? `?table=${encodeURIComponent(tableQrToken)}` : ""
              }`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F291E] px-4 py-2.5 text-xs font-semibold text-white"
            >
              Browse Digital Menu
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-card space-y-4">
              <h2 className="font-display font-bold text-base text-[#0F291E]">
                Selected Dishes ({lines.reduce((s, l) => s + l.quantity, 0)})
              </h2>
              <div className="divide-y divide-[#E5E0D5]">
                {lines.map((line) => {
                  const unitPrice =
                    line.basePricePaise +
                    line.variantPriceDeltaPaise +
                    line.selectedAddons.reduce((s, a) => s + a.pricePaise, 0);
                  return (
                    <div
                      key={line.cartLineId}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm text-[#0F291E]">
                          {line.name}
                        </p>
                        {line.variantName && (
                          <p className="text-[11px] text-[#4A5950]">
                            Portion: {line.variantName}
                          </p>
                        )}
                        {line.selectedAddons.length > 0 && (
                          <p className="text-[11px] text-[#4A5950]">
                            Add-ons:{" "}
                            {line.selectedAddons.map((a) => a.name).join(", ")}
                          </p>
                        )}
                        {line.notes && (
                          <p className="text-[11px] text-amber-800">
                            Note: {line.notes}
                          </p>
                        )}
                        <p className="font-mono text-xs font-bold text-[#0F291E]">
                          {formatINR(unitPrice * line.quantity)}
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-2.5 rounded-xl border border-[#E5E0D5] px-2.5 py-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.cartLineId, -1)}
                        >
                          {line.quantity === 1 ? (
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          ) : (
                            <Minus className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <span className="font-mono font-bold text-xs">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.cartLineId, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-card space-y-4">
              <h2 className="font-display font-bold text-base text-[#0F291E]">
                Dining Mode & Table Verification
              </h2>

              <div className="grid grid-cols-3 gap-2">
                {(["DINE_IN", "TAKEAWAY", "DELIVERY"] as OrderType[]).map(
                  (t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOrderType(t)}
                      className={`rounded-xl py-2.5 text-xs font-bold border transition-all ${
                        orderType === t
                          ? "bg-[#0F291E] text-white border-[#0F291E]"
                          : "bg-[#FBF9F5] border-[#E5E0D5] text-[#4A5950]"
                      }`}
                    >
                      {t.replace("_", "-")}
                    </button>
                  )
                )}
              </div>

              {orderType === "DINE_IN" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">
                      Table QR Token
                    </label>
                    <input
                      required
                      value={tableQrToken}
                      onChange={(e) => setTableQrToken(e.target.value)}
                      placeholder="tbl_saoji_t01"
                      className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Append to Running Table Order Token (Optional)
                    </label>
                    <input
                      value={appendToOrderToken}
                      onChange={(e) => setAppendToOrderToken(e.target.value)}
                      placeholder="Leave blank or auto-links active table session"
                      className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 font-mono"
                    />
                  </div>
                </div>
              )}

              {orderType === "DELIVERY" && (
                <div className="text-xs">
                  <label className="block font-semibold mb-1">
                    Full Delivery Address *
                  </label>
                  <input
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Flat 402, Dharampeth Extension, Nagpur"
                    className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">
                    Your Name *
                  </label>
                  <input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Phone Number (for Loyalty Points) *
                  </label>
                  <input
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-semibold mb-1">
                  Order-Level Kitchen Instructions
                </label>
                <input
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Serve starters first, extra lemon wedges..."
                  className="w-full rounded-lg border border-[#E5E0D5] px-3 py-2"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-card space-y-3">
              <h2 className="font-display font-bold text-base text-[#0F291E] flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-[#D97706]" />
                Payment Preference
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  {
                    id: "UPI" as const,
                    label: "UPI Deep-Link / QR",
                    desc: "Pay via GPay / PhonePe; verified by cashier",
                  },
                  {
                    id: "UNSPECIFIED" as const,
                    label: "Pay After Meal",
                    desc: "Settle single bill when closing table",
                  },
                  {
                    id: "CASH" as const,
                    label: "Cash at Table",
                    desc: "Hand cash to steward on bill presentation",
                  },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`text-left rounded-xl border p-3 transition-all ${
                      paymentMethod === pm.id
                        ? "border-[#0F291E] ring-2 ring-[#0F291E] bg-[#FBF9F5]"
                        : "border-[#E5E0D5] bg-white"
                    }`}
                  >
                    <p className="font-bold text-[#0F291E]">{pm.label}</p>
                    <p className="text-[11px] text-[#4A5950] mt-0.5">
                      {pm.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E0D5] bg-white p-5 shadow-card space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
                <span className="font-display font-bold text-sm text-[#0F291E] flex items-center gap-1.5">
                  <ReceiptIndianRupee className="h-4 w-4 text-[#0F291E]" />
                  Itemized GST Bill Breakdown ({settings.taxMode})
                </span>
                <span className="font-mono text-[11px] text-[#718077]">
                  Integer Paise Engine
                </span>
              </div>

              <div className="flex justify-between text-[#4A5950]">
                <span>Item Subtotal</span>
                <span className="font-mono font-semibold">
                  {formatINR(billPreview.subtotalPaise)}
                </span>
              </div>
              {billPreview.packagingTotalPaise > 0 && (
                <div className="flex justify-between text-[#4A5950]">
                  <span>Container / Packaging Fee</span>
                  <span className="font-mono">
                    {formatINR(billPreview.packagingTotalPaise)}
                  </span>
                </div>
              )}
              {billPreview.serviceChargePaise > 0 && (
                <div className="flex justify-between text-[#4A5950]">
                  <span>Service Charge</span>
                  <span className="font-mono">
                    {formatINR(billPreview.serviceChargePaise)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[#4A5950]">
                <span>CGST ({settings.cgstRateBps / 100}%)</span>
                <span className="font-mono">
                  {formatINR(billPreview.cgstPaise)}
                </span>
              </div>
              <div className="flex justify-between text-[#4A5950]">
                <span>SGST ({settings.sgstRateBps / 100}%)</span>
                <span className="font-mono">
                  {formatINR(billPreview.sgstPaise)}
                </span>
              </div>
              {billPreview.roundOffPaise !== 0 && (
                <div className="flex justify-between text-[#718077]">
                  <span>Rupee Round-Off</span>
                  <span className="font-mono">
                    {billPreview.roundOffPaise > 0 ? "+" : ""}
                    {formatINR(billPreview.roundOffPaise)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-[#0F291E] border-t border-[#E5E0D5] pt-2.5">
                <span>Payable Grand Total</span>
                <span className="font-mono">
                  {formatINR(billPreview.totalPaise)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F291E] py-4 px-6 text-sm font-bold text-white hover:bg-[#163829] shadow-editorial disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4 text-[#84CC16]" />
              {submitting
                ? "Firing KOT to Kitchen..."
                : `Confirm & Send Order to Kitchen (${formatINR(
                    billPreview.totalPaise
                  )})`}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default function GuestCartCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-6 text-xs text-[#4A5950]">
          Loading guest cart...
        </div>
      }
    >
      <GuestCartCheckoutContent />
    </Suspense>
  );
}
