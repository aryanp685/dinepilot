"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Search,
  ShoppingBag,
  Sparkles,
  Flame,
  Plus,
  Minus,
  UtensilsCrossed,
  Palette,
  ArrowRight,
} from "lucide-react";
import { formatINR, QrThemePreset } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import {
  GuestCartLine,
  loadGuestCart,
  saveGuestCart,
} from "@/lib/guestCart";
import { useToast } from "@/providers/AppProviders";

function GuestQrMenuContent() {
  const params = useParams<{ restaurantSlug: string }>();
  const searchParams = useSearchParams();
  const restaurantSlug = params?.restaurantSlug || "saoji-spice-nagpur";
  const tableParam = searchParams?.get("table") || undefined;
  const appendOrderParam = searchParams?.get("appendOrder") || undefined;

  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const [themeOverride, setThemeOverride] = useState<QrThemePreset | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [dietFilter, setDietFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartLines, setCartLines] = useState<GuestCartLine[]>([]);

  const [customizingItem, setCustomizingItem] = useState<any | null>(null);
  const [selectedVariantName, setSelectedVariantName] = useState<string>("");
  const [selectedAddonNames, setSelectedAddonNames] = useState<string[]>([]);
  const [itemNotes, setItemNotes] = useState("");
  const [itemQty, setItemQty] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-menu", restaurantSlug, tableParam],
    queryFn: () =>
      apiFetch(
        `/public/menu/${restaurantSlug}${
          tableParam ? `?table=${encodeURIComponent(tableParam)}` : ""
        }`
      ),
  });

  useEffect(() => {
    const existing = loadGuestCart(restaurantSlug);
    const nextState = {
      ...existing,
      tableQrToken: tableParam || existing.tableQrToken,
      appendToOrderToken: appendOrderParam || existing.appendToOrderToken,
    };
    saveGuestCart(nextState);
    setCartLines(nextState.lines);
  }, [restaurantSlug, tableParam, appendOrderParam]);

  const restaurant = data?.restaurant;
  const categories = data?.categories || [];
  const items = data?.items || [];
  const activeTable = data?.table;

  const activeTheme: QrThemePreset =
    themeOverride || restaurant?.qrThemePreset || "botanical";

  const filteredItems = items.filter((item: any) => {
    if (
      selectedCategoryId !== "ALL" &&
      String(item.categoryId) !== selectedCategoryId
    ) {
      return false;
    }
    if (dietFilter === "VEG" && item.dietaryTag !== "VEG" && item.dietaryTag !== "JAIN") {
      return false;
    }
    if (dietFilter === "JAIN" && item.dietaryTag !== "JAIN") {
      return false;
    }
    if (dietFilter === "BESTSELLER" && !item.isBestseller) {
      return false;
    }
    if (dietFilter === "SAOJI_FIERY" && item.spiceLevel !== "SAOJI_FIERY") {
      return false;
    }
    if (
      searchQuery &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  function openCustomizeModal(item: any) {
    setCustomizingItem(item);
    setSelectedVariantName(item.variants?.[0]?.name || "");
    setSelectedAddonNames([]);
    setItemNotes("");
    setItemQty(1);
  }

  function handleAddCustomizedItem() {
    if (!customizingItem) return;
    const variantObj = (customizingItem.variants || []).find(
      (v: any) => v.name === selectedVariantName
    );
    const addonObjs = (customizingItem.addons || []).filter((a: any) =>
      selectedAddonNames.includes(a.name)
    );

    const newLine: GuestCartLine = {
      cartLineId: `${customizingItem._id}_${selectedVariantName}_${selectedAddonNames.join(
        "-"
      )}_${Date.now()}`,
      menuItemId: customizingItem._id,
      name: customizingItem.name,
      basePricePaise: customizingItem.basePricePaise,
      packagingFeePaise: customizingItem.packagingFeePaise || 0,
      dietaryTag: customizingItem.dietaryTag,
      spiceLevel: customizingItem.spiceLevel,
      quantity: itemQty,
      variantName: variantObj?.name,
      variantPriceDeltaPaise: variantObj?.priceDeltaPaise || 0,
      selectedAddons: addonObjs.map((a: any) => ({
        name: a.name,
        pricePaise: a.pricePaise,
      })),
      notes: itemNotes || undefined,
    };

    const current = loadGuestCart(restaurantSlug);
    const updatedLines = [...current.lines, newLine];
    saveGuestCart({
      ...current,
      tableQrToken: tableParam || current.tableQrToken,
      appendToOrderToken: appendOrderParam || current.appendToOrderToken,
      lines: updatedLines,
    });
    setCartLines(updatedLines);
    setCustomizingItem(null);
    toast({
      title: `Added ${customizingItem.name} to cart`,
      variant: "success",
    });
  }

  const totalItemsInCart = cartLines.reduce((acc, l) => acc + l.quantity, 0);
  const cartSubtotalPaise = cartLines.reduce((acc, l) => {
    const addonSum = l.selectedAddons.reduce((s, a) => s + a.pricePaise, 0);
    return (
      acc + (l.basePricePaise + l.variantPriceDeltaPaise + addonSum) * l.quantity
    );
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="h-10 w-10 rounded-xl bg-[#176B52] text-[#20A67A] flex items-center justify-center mx-auto animate-pulse">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-[#64748B]">
            Loading digital QR menu...
          </p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-[#101820]">
            Restaurant Menu Unavailable
          </h1>
          <p className="text-xs text-[#64748B]">
            We couldn’t find a menu for slug <code>{restaurantSlug}</code>.
          </p>
          <Link
            href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
            className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white"
          >
            Open Flagship Demo Menu (Saoji Spice Kitchen)
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`qr-theme-${activeTheme} min-h-screen pb-28 transition-colors duration-200`}
      style={{
        backgroundColor: "var(--qr-bg)",
        color: "var(--qr-text)",
      }}
    >
      <header
        className="border-b sticky top-0 z-30 backdrop-blur-md"
        style={{
          backgroundColor: "var(--qr-surface)",
          borderColor: "rgba(128,128,128,0.2)",
        }}
      >
        <div className="mx-auto max-w-3xl px-4 py-3.5 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: "var(--qr-primary)",
                    color: "#FFFFFF",
                  }}
                >
                  {activeTable
                    ? `Dine-In • Table ${activeTable.label} (${activeTable.zone})`
                    : "Digital QR Menu"}
                </span>
                {appendOrderParam && (
                  <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                    Adding KOT Batch to Active Table Order
                  </span>
                )}
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold mt-1">
                {restaurant.name}
              </h1>
              <p className="text-xs opacity-75">
                {restaurant.address || `${restaurant.city}, ${restaurant.state}`}{" "}
                • FSSAI {restaurant.fssaiNumber || "Verified"}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] opacity-70 inline-flex items-center gap-1">
                <Palette className="h-3 w-3" /> QR Theme
              </span>
              <select
                value={activeTheme}
                onChange={(e) =>
                  setThemeOverride(e.target.value as QrThemePreset)
                }
                aria-label="QR Menu Theme Preset"
                className="rounded-lg border px-2 py-1 text-[11px] font-semibold bg-transparent"
                style={{ borderColor: "rgba(128,128,128,0.35)" }}
              >
                <option value="botanical" className="text-black">
                  Botanical
                </option>
                <option value="midnight" className="text-black">
                  Midnight
                </option>
                <option value="terracotta" className="text-black">
                  Terracotta
                </option>
                <option value="nordic" className="text-black">
                  Nordic
                </option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Saoji Handi, Patodi, Indori Poha..."
                className="w-full rounded-xl border pl-8 pr-3 py-2 text-xs bg-transparent focus:outline-none"
                style={{ borderColor: "rgba(128,128,128,0.3)" }}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All" },
                { id: "VEG", label: "Pure Veg" },
                { id: "JAIN", label: "Jain" },
                { id: "BESTSELLER", label: "Bestsellers" },
                { id: "SAOJI_FIERY", label: "Saoji Fiery" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setDietFilter(pill.id)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-all"
                  style={
                    dietFilter === pill.id
                      ? {
                          backgroundColor: "var(--qr-primary)",
                          color: "#FFFFFF",
                          borderColor: "var(--qr-primary)",
                        }
                      : {
                          borderColor: "rgba(128,128,128,0.3)",
                        }
                  }
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryId("ALL")}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={
                selectedCategoryId === "ALL"
                  ? {
                      backgroundColor: "var(--qr-accent)",
                      color: "#0F291E",
                    }
                  : { opacity: 0.75 }
              }
            >
              All Categories ({items.length})
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat._id}
                type="button"
                onClick={() => setSelectedCategoryId(String(cat._id))}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                style={
                  selectedCategoryId === String(cat._id)
                    ? {
                        backgroundColor: "var(--qr-accent)",
                        color: "#0F291E",
                      }
                    : { opacity: 0.75 }
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-3">
        {filteredItems.length === 0 ? (
          <div
            className="rounded-2xl border p-12 text-center space-y-2"
            style={{
              backgroundColor: "var(--qr-surface)",
              borderColor: "rgba(128,128,128,0.2)",
            }}
          >
            <p className="font-display font-bold text-base">
              No dishes match your filter
            </p>
            <button
              type="button"
              onClick={() => {
                setDietFilter("ALL");
                setSelectedCategoryId("ALL");
                setSearchQuery("");
              }}
              className="text-xs underline opacity-80"
            >
              Reset menu filters
            </button>
          </div>
        ) : (
          filteredItems.map((item: any) => (
            <div
              key={item._id}
              className="rounded-2xl border p-4 sm:p-5 flex items-start justify-between gap-4 transition-all"
              style={{
                backgroundColor: "var(--qr-surface)",
                borderColor: "rgba(128,128,128,0.2)",
              }}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                      item.dietaryTag === "VEG" ||
                      item.dietaryTag === "JAIN" ||
                      item.dietaryTag === "VEGAN"
                        ? "border-emerald-600 text-emerald-600"
                        : "border-red-600 text-red-600"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.dietaryTag === "VEG" ||
                        item.dietaryTag === "JAIN" ||
                        item.dietaryTag === "VEGAN"
                          ? "bg-emerald-600"
                          : "bg-red-600"
                      }`}
                    />
                    {item.dietaryTag}
                  </span>

                  {item.spiceLevel === "SAOJI_FIERY" && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-red-600/15 px-2 py-0.5 text-[10px] font-bold text-red-500">
                      <Flame className="h-3 w-3" /> SAOJI FIERY
                    </span>
                  )}

                  {item.isBestseller && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                      <Sparkles className="h-3 w-3" /> Bestseller
                    </span>
                  )}
                </div>

                <h2 className="font-display font-bold text-base sm:text-lg">
                  {item.name}
                </h2>
                <p className="font-mono font-bold text-sm">
                  {formatINR(item.basePricePaise)}
                </p>
                {item.description && (
                  <p className="text-xs opacity-75 leading-relaxed">
                    {item.description}
                  </p>
                )}
                {(item.variants?.length > 0 || item.addons?.length > 0) && (
                  <p className="text-[11px] opacity-60">
                    Customizable portions & add-ons available
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => openCustomizeModal(item)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-transform active:scale-95"
                  style={{
                    backgroundColor: "var(--qr-primary)",
                    color: "#FFFFFF",
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  ADD
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      <AnimatePresence>
        {customizingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#101820]/60 backdrop-blur-xs p-0 sm:p-4"
            onClick={() => setCustomizingItem(null)}
          >
            <motion.div
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: 24, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 16, scale: 0.98 }
              }
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white text-[#101820] p-6 space-y-4 shadow-elevated max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#64748B]">
                    {customizingItem.dietaryTag} • {customizingItem.spiceLevel}
                  </span>
                  <h3 className="font-display font-bold text-lg text-[#101820]">
                    {customizingItem.name}
                  </h3>
                  <p className="font-mono text-xs font-semibold text-[#64748B]">
                    Base Price: {formatINR(customizingItem.basePricePaise)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomizingItem(null)}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#101820]"
                >
                  Close ✕
                </button>
              </div>

              {customizingItem.variants?.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#101820]">
                    Choose Portion / Variant
                  </label>
                  <div className="space-y-1.5">
                    {customizingItem.variants.map((v: any) => (
                      <label
                        key={v.name}
                        className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-xs cursor-pointer hover:bg-[#F8F7F3]"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <input
                            type="radio"
                            name="variant"
                            checked={selectedVariantName === v.name}
                            onChange={() => setSelectedVariantName(v.name)}
                          />
                          {v.name}
                        </span>
                        <span className="font-mono font-semibold text-[#101820]">
                          {v.priceDeltaPaise >= 0
                            ? `+${formatINR(v.priceDeltaPaise)}`
                            : formatINR(v.priceDeltaPaise)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {customizingItem.addons?.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#101820]">
                    Optional Add-Ons
                  </label>
                  <div className="space-y-1.5">
                    {customizingItem.addons.map((a: any) => {
                      const checked = selectedAddonNames.includes(a.name);
                      return (
                        <label
                          key={a.name}
                          className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-xs cursor-pointer hover:bg-[#F8F7F3]"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAddonNames([
                                    ...selectedAddonNames,
                                    a.name,
                                  ]);
                                } else {
                                  setSelectedAddonNames(
                                    selectedAddonNames.filter(
                                      (n) => n !== a.name
                                    )
                                  );
                                }
                              }}
                            />
                            {a.name}
                          </span>
                          <span className="font-mono font-semibold text-[#101820]">
                            +{formatINR(a.pricePaise)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#101820] mb-1">
                  Cooking Instructions (Optional)
                </label>
                <input
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Less oil, extra tarri, Jain preparation..."
                  className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="inline-flex items-center gap-3 rounded-xl border border-[#E5E7EB] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono font-bold text-sm">{itemQty}</span>
                  <button
                    type="button"
                    onClick={() => setItemQty(Math.min(20, itemQty + 1))}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomizedItem}
                  className="flex-1 rounded-xl bg-[#176B52] py-3 px-4 text-xs font-bold text-white hover:bg-[#125541]"
                >
                  Add {itemQty} to Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {totalItemsInCart > 0 && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-0 inset-x-0 z-40 p-4"
          >
            <div className="mx-auto max-w-3xl rounded-2xl bg-[#101820] border border-white/15 text-white p-4 shadow-navy flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#176B52] text-white flex items-center justify-center font-mono font-bold text-sm">
                  {totalItemsInCart}
                </div>
                <div>
                  <p className="font-mono font-bold text-sm tabular-nums">
                    {formatINR(cartSubtotalPaise)}{" "}
                    <span className="text-[11px] font-normal text-[#94A3B8]">
                      + GST
                    </span>
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    {appendOrderParam
                      ? "Ready to fire next KOT batch to kitchen"
                      : "Review bill breakdown & fire KOT"}
                  </p>
                </div>
              </div>

              <Link
                href={`/menu/${restaurantSlug}/cart${
                  tableParam ? `?table=${encodeURIComponent(tableParam)}` : ""
                }`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#125541] transition-colors"
              >
                <ShoppingBag className="h-4 w-4 text-[#20A67A]" />
                View Cart & Checkout
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GuestQrMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-6 text-xs text-[#64748B]">
          Loading digital QR menu...
        </div>
      }
    >
      <GuestQrMenuContent />
    </Suspense>
  );
}
