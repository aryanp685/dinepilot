"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Scale,
  QrCode,
  ChefHat,
  Award,
  BarChart3,
  ShieldCheck,
  Check,
  Sparkles,
  Layers,
  ReceiptIndianRupee,
  TrendingUp,
  AlertTriangle,
  Clock,
  UtensilsCrossed,
  Flame,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { formatINR } from "@dinepilot/shared";

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [selectedDemoDish, setSelectedDemoDish] = useState<
    "mutton" | "paneer" | "patodi"
  >("mutton");

  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState<
    "profitability" | "kds" | "copilot"
  >("profitability");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced || !rootRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .from("[data-gsap='hero-badge']", {
          y: 14,
          opacity: 0,
          duration: 0.45,
        })
        .from(
          "[data-gsap='hero-title']",
          { y: 20, opacity: 0, duration: 0.55 },
          "-=0.25"
        )
        .from(
          "[data-gsap='hero-lead']",
          { y: 16, opacity: 0, duration: 0.5 },
          "-=0.3"
        )
        .from(
          "[data-gsap='hero-cta']",
          { y: 14, opacity: 0, duration: 0.45 },
          "-=0.3"
        )
        .from(
          "[data-gsap='hero-metrics'] > div",
          { y: 12, opacity: 0, stagger: 0.08, duration: 0.4 },
          "-=0.25"
        )
        .from(
          "[data-gsap='hero-inspector']",
          { y: 24, opacity: 0, duration: 0.6 },
          "-=0.5"
        );

      gsap.utils
        .toArray<HTMLElement>("[data-gsap='reveal-section']")
        .forEach((sec) => {
          gsap.from(sec, {
            y: 28,
            opacity: 0,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sec,
              start: "top 86%",
              toggleActions: "play none none none",
            },
          });
        });
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const sampleDishes = {
    mutton: {
      name: "Nagpuri Saoji Mutton Handi",
      sellingPaise: 46000,
      rawIngredientPaise: 20600,
      yieldAdjustedPaise: 22800,
      packagingPaise: 2000,
      quadrant: "HIGH_VOLUME_HIGH_MARGIN",
      quadrantLabel: "Star Performer (High Volume • High Gross Profit)",
      note: "10% butcher trim & 15% onion peeling loss factored into real recipe cost.",
    },
    paneer: {
      name: "Varhadi Roasted Paneer Masala",
      sellingPaise: 34000,
      rawIngredientPaise: 9200,
      yieldAdjustedPaise: 9600,
      packagingPaise: 1500,
      quadrant: "HIGH_VOLUME_HIGH_MARGIN",
      quadrantLabel: "Star Performer (72% Gross Margin)",
      note: "High repeat demand with predictable dairy & spice unit economics.",
    },
    patodi: {
      name: "Traditional Patodi Rassa",
      sellingPaise: 28000,
      rawIngredientPaise: 4100,
      yieldAdjustedPaise: 4400,
      packagingPaise: 1500,
      quadrant: "LOW_VOLUME_HIGH_MARGIN",
      quadrantLabel: "Puzzle (High Margin • Upsell Opportunity)",
      note: "84% gross margin. AI Copilot recommends featuring as a QR cart pairing.",
    },
  };

  const activeDish = sampleDishes[selectedDemoDish];
  const grossProfitPaise =
    activeDish.sellingPaise -
    activeDish.yieldAdjustedPaise -
    activeDish.packagingPaise;
  const foodCostPct = (
    (activeDish.yieldAdjustedPaise / activeDish.sellingPaise) *
    100
  ).toFixed(1);

  return (
    <MarketingLayout>
      <div ref={rootRef}>
        <section className="relative overflow-hidden bg-navy-mesh text-[#F8F7F3] border-b border-white/10 pt-14 pb-20 lg:pt-24 lg:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div
                  data-gsap="hero-badge"
                  className="inline-flex items-center gap-2 rounded-full border border-[#C6A15B]/35 bg-[#182430] px-3.5 py-1.5 text-xs font-semibold text-[#F8F7F3]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#C6A15B]" />
                  <span>
                    Restaurant Profitability, Inventory & QR Operations Platform
                  </span>
                </div>

                <h1
                  data-gsap="hero-title"
                  className="font-display text-fluid-hero font-bold tracking-tight text-white"
                >
                  Don’t just take orders.{" "}
                  <span className="text-[#20A67A]">
                    Know which dishes make money.
                  </span>
                </h1>

                <p
                  data-gsap="hero-lead"
                  className="text-base sm:text-lg text-[#94A3B8] max-w-2xl leading-relaxed"
                >
                  Most restaurant software stops after printing a receipt.{" "}
                  <strong className="text-white font-semibold">
                    DinePilot
                  </strong>{" "}
                  connects mobile QR table ordering and your live kitchen
                  display directly to yield-adjusted recipe costing, auditable
                  ingredient stock ledgers, Indian GST compliance, and an AI
                  Business Copilot.
                </p>

                <div
                  data-gsap="hero-cta"
                  className="flex flex-wrap items-center gap-3.5 pt-2"
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#125541] transition-all shadow-navy"
                  >
                    Launch Interactive Demo Workspace
                    <ArrowRight className="h-4 w-4 text-[#20A67A]" />
                  </Link>
                  <Link
                    href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#182430] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#223242] transition-colors"
                  >
                    <QrCode className="h-4 w-4 text-[#C6A15B]" />
                    Try Guest QR Menu (Table T-01)
                  </Link>
                </div>

                <div
                  data-gsap="hero-metrics"
                  className="grid grid-cols-3 gap-5 pt-7 border-t border-white/10 text-xs text-[#94A3B8]"
                >
                  <div>
                    <p className="font-mono font-bold text-base text-white tabular-nums">
                      Integer Paise
                    </p>
                    <p className="mt-0.5">
                      Zero floating-point drift across GST & recipes
                    </p>
                  </div>
                  <div>
                    <p className="font-mono font-bold text-base text-white tabular-nums">
                      Multi-KOT QR
                    </p>
                    <p className="mt-0.5">
                      Running table bills for repeat dine-in rounds
                    </p>
                  </div>
                  <div>
                    <p className="font-mono font-bold text-base text-white tabular-nums">
                      Yield-Aware
                    </p>
                    <p className="mt-0.5">
                      Accounts for peeling & butcher shrinkage
                    </p>
                  </div>
                </div>
              </div>

              <div data-gsap="hero-inspector" className="lg:col-span-5">
                <div className="rounded-2xl border border-white/15 bg-white text-[#101820] p-6 shadow-navy space-y-5">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#176B52]">
                        Interactive Unit Economics Preview
                      </span>
                      <h2 className="font-display font-bold text-lg text-[#101820]">
                        Live Dish Margin Inspector
                      </h2>
                    </div>
                    <span className="rounded-md bg-[#E8F3EF] border border-[#176B52]/20 px-2.5 py-1 font-mono text-xs font-semibold text-[#176B52]">
                      INR • Paise Engine
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#F8F7F3] p-1 rounded-xl border border-[#E5E7EB]">
                    {(
                      [
                        { id: "mutton", label: "Saoji Mutton" },
                        { id: "paneer", label: "Varhadi Paneer" },
                        { id: "patodi", label: "Patodi Rassa" },
                      ] as const
                    ).map((tab) => {
                      const active = selectedDemoDish === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedDemoDish(tab.id)}
                          className={`relative rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors z-10 ${
                            active
                              ? "text-white"
                              : "text-[#64748B] hover:text-[#101820]"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="hero-dish-pill"
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="absolute inset-0 rounded-lg bg-[#176B52] -z-10 shadow-sm"
                            />
                          )}
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedDemoDish}
                      initial={
                        prefersReducedMotion
                          ? { opacity: 1 }
                          : { opacity: 0, y: 6 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        prefersReducedMotion
                          ? { opacity: 1 }
                          : { opacity: 0, y: -6 }
                      }
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="rounded-xl bg-[#F8F7F3] p-4 border border-[#E5E7EB] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-sm text-[#101820]">
                          {activeDish.name}
                        </span>
                        <span className="font-mono font-bold text-sm text-[#176B52] tabular-nums">
                          Menu Price: {formatINR(activeDish.sellingPaise)}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-[#64748B]">
                          <span>Naive Raw Purchase Cost</span>
                          <span className="font-mono line-through text-[#94A3B8] tabular-nums">
                            {formatINR(activeDish.rawIngredientPaise)}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium text-[#101820]">
                          <span>Yield-Adjusted Recipe Cost</span>
                          <span className="font-mono text-amber-700 tabular-nums">
                            {formatINR(activeDish.yieldAdjustedPaise)} (
                            {foodCostPct}%)
                          </span>
                        </div>
                        <div className="flex justify-between text-[#64748B]">
                          <span>Takeaway Container Allocation</span>
                          <span className="font-mono tabular-nums">
                            {formatINR(activeDish.packagingPaise)}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-center">
                          <span className="font-semibold text-[#101820]">
                            Net Dish Contribution Margin
                          </span>
                          <span className="font-mono font-bold text-base text-[#20A67A] tabular-nums">
                            +{formatINR(grossProfitPaise)} / order
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-white border border-[#E5E7EB] px-3 py-2 text-xs text-[#101820] flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-[#20A67A] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-[#176B52]">
                            {activeDish.quadrantLabel}
                          </p>
                          <p className="text-[#64748B] mt-0.5">
                            {activeDish.note}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
                    <span>Powered by `@dinepilot/shared` costing engine</span>
                    <Link
                      href="/login"
                      className="font-semibold text-[#176B52] hover:underline inline-flex items-center gap-1"
                    >
                      Inspect Full Matrix <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          data-gsap="reveal-section"
          className="py-16 lg:py-24 bg-[#F8F7F3] border-b border-[#E5E7EB]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl space-y-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#176B52]">
                  Interactive Product Architecture
                </span>
                <h2 className="font-display text-fluid-h2 font-bold text-[#101820]">
                  A single operational ledger from guest table to kitchen margin
                </h2>
              </div>

              <div className="inline-flex rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-card">
                {(
                  [
                    { id: "profitability", label: "Profitability Matrix" },
                    { id: "kds", label: "Live KDS & Multi-KOT" },
                    { id: "copilot", label: "AI Business Copilot" },
                  ] as const
                ).map((tab) => {
                  const active = activeWorkbenchTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveWorkbenchTab(tab.id)}
                      className={`relative rounded-lg px-4 py-2 text-xs font-semibold transition-colors z-10 ${
                        active
                          ? "text-white"
                          : "text-[#64748B] hover:text-[#101820]"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="workbench-tab-pill"
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute inset-0 rounded-lg bg-[#101820] -z-10"
                        />
                      )}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeWorkbenchTab === "profitability" && (
                <motion.div
                  key="profitability"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: -10 }
                  }
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-6 lg:p-8 shadow-editorial grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-5 space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8F3EF] px-2.5 py-1 text-xs font-semibold text-[#176B52]">
                      <BarChart3 className="h-3.5 w-3.5" />
                      4-Quadrant Menu Engineering
                    </span>
                    <h3 className="font-display text-fluid-h3 font-bold text-[#101820]">
                      Identify Stars, Plowhorses, Puzzles, and Dogs automatically
                    </h3>
                    <p className="text-sm text-[#64748B] leading-relaxed">
                      Every completed order cross-references your yield-adjusted
                      recipe cards to calculate net sales, ingredient cost, and
                      contribution margin in integer paise.
                    </p>
                    <ul className="space-y-2 text-xs text-[#475569]">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#20A67A]" />
                        <span>
                          Accounts for usable yield % (onion peeling, mutton
                          trimming)
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#20A67A]" />
                        <span>
                          Flags uncosted menu items before they distort gross
                          margin
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#20A67A]" />
                        <span>
                          One-click CSV export for your chartered accountant
                        </span>
                      </li>
                    </ul>
                    <div className="pt-2">
                      <Link
                        href="/app/analytics"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541] transition-colors"
                      >
                        Open Live Profitability Matrix
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        quadrant: "STAR",
                        badge: "bg-[#E6F7F1] text-[#176B52] border-[#20A67A]/30",
                        dish: "Nagpuri Saoji Mutton Handi",
                        units: "42 orders",
                        margin: "50.4% Gross Margin",
                        profit: formatINR(974400),
                        action: "Maintain portion consistency & prime placement",
                      },
                      {
                        quadrant: "PLOWHORSE",
                        badge: "bg-amber-50 text-amber-800 border-amber-200",
                        dish: "Indori Poha & Tarri Platter",
                        units: "68 orders",
                        margin: "38.2% Gross Margin",
                        profit: formatINR(412000),
                        action:
                          "High traffic driver — pair with high-margin beverage",
                      },
                      {
                        quadrant: "PUZZLE",
                        badge: "bg-[#F9F4EA] text-[#101820] border-[#C6A15B]/40",
                        dish: "Traditional Patodi Rassa",
                        units: "14 orders",
                        margin: "84.2% Gross Margin",
                        profit: formatINR(330400),
                        action: "Feature in QR cart upsell recommendations",
                      },
                      {
                        quadrant: "DOG",
                        badge: "bg-slate-100 text-slate-700 border-slate-200",
                        dish: "Classic Cold Coffee Shake",
                        units: "7 orders",
                        margin: "31.0% Gross Margin",
                        profit: formatINR(48500),
                        action: "Evaluate recipe cost or seasonal rotation",
                      },
                    ].map((card) => (
                      <div
                        key={card.dish}
                        className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${card.badge}`}
                          >
                            {card.quadrant}
                          </span>
                          <span className="font-mono text-xs text-[#64748B] tabular-nums">
                            {card.units}
                          </span>
                        </div>
                        <p className="font-display font-bold text-sm text-[#101820]">
                          {card.dish}
                        </p>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E7EB]">
                          <span className="text-[#64748B]">{card.margin}</span>
                          <span className="font-mono font-bold text-[#176B52] tabular-nums">
                            {card.profit}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          {card.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeWorkbenchTab === "kds" && (
                <motion.div
                  key="kds"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: -10 }
                  }
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="rounded-2xl border border-[#E5E7EB] bg-[#101820] text-[#F8F7F3] p-6 lg:p-8 shadow-navy grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-5 space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#176B52]/30 border border-[#20A67A]/30 px-2.5 py-1 text-xs font-semibold text-[#20A67A]">
                      <ChefHat className="h-3.5 w-3.5" />
                      Real-Time Socket.IO Kitchen Display
                    </span>
                    <h3 className="font-display text-fluid-h3 font-bold text-white">
                      Built for Indian family dining & multi-KOT running tables
                    </h3>
                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                      Guests don’t order starters, rotis, and desserts in a
                      single cart. DinePilot lets diners or waiters fire KOT
                      Batch #2 and #3 into an active table session and settle
                      one consolidated GST bill at the end of the meal.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-3">
                      <Link
                        href="/kitchen"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541] transition-colors"
                      >
                        Open Live KDS Screen
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href="/order/ord_demo_preparing_1010"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#182430] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#223242] transition-colors"
                      >
                        View Guest Order Tracker
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[#20A67A]/40 bg-[#182430] p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white">
                            #DP-1010
                          </span>
                          <span className="rounded bg-[#176B52] px-2 py-0.5 text-[10px] font-bold text-white">
                            TABLE T-01
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded bg-[#20A67A]/20 px-2 py-0.5 font-mono text-[11px] font-bold text-[#20A67A]">
                          <Clock className="h-3 w-3" /> 6m • ON SLA
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="rounded-lg bg-[#101820] p-2.5 flex items-center justify-between">
                          <span>1× Nagpuri Saoji Mutton Handi</span>
                          <span className="font-mono text-[10px] text-[#C6A15B]">
                            KOT #1
                          </span>
                        </div>
                        <div className="rounded-lg bg-[#101820] p-2.5 flex items-center justify-between">
                          <span>4× Garlic Butter Tandoori Roti</span>
                          <span className="font-mono text-[10px] text-[#20A67A]">
                            KOT #2 (New)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-500/40 bg-[#182430] p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white">
                            #DP-1011
                          </span>
                          <span className="rounded bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                            TABLE T-03
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500 text-[#101820] px-2 py-0.5 font-mono text-[11px] font-bold">
                          <Clock className="h-3 w-3" /> 14m • READY
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="rounded-lg bg-[#101820] p-2.5 flex items-center justify-between">
                          <span>2× Varhadi Paneer Masala (Jain)</span>
                          <span className="font-mono text-[10px] text-[#20A67A]">
                            JAIN PREP
                          </span>
                        </div>
                        <div className="rounded-lg bg-[#101820] p-2.5 flex items-center justify-between">
                          <span>1× Traditional Patodi Rassa</span>
                          <span className="font-mono text-[10px] text-[#C6A15B]">
                            KOT #1
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeWorkbenchTab === "copilot" && (
                <motion.div
                  key="copilot"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: -10 }
                  }
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-6 lg:p-8 shadow-editorial grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-5 space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F9F4EA] border border-[#C6A15B]/30 px-2.5 py-1 text-xs font-semibold text-[#101820]">
                      <BrainCircuit className="h-3.5 w-3.5 text-[#C6A15B]" />
                      Deterministic AI Business Copilot
                    </span>
                    <h3 className="font-display text-fluid-h3 font-bold text-[#101820]">
                      Grounded financial insights — never hallucinated numbers
                    </h3>
                    <p className="text-sm text-[#64748B] leading-relaxed">
                      Ask natural-language operational questions and receive
                      answers strictly separated between measured historical
                      ledger data and 7-day ingredient replenishment forecasts.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/app/ai-insights"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541] transition-colors"
                      >
                        Ask AI Business Copilot
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-3">
                    <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B52]">
                          Measured Historical Fact (30d Ledger)
                        </span>
                        <span className="font-mono text-xs text-[#64748B]">
                          Deterministic Engine
                        </span>
                      </div>
                      <p className="text-xs text-[#101820] leading-relaxed">
                        <strong>Nagpuri Saoji Mutton Handi</strong> generated
                        the highest total gross profit contribution this period,
                        while <strong>Traditional Patodi Rassa</strong> achieved
                        an 84.2% contribution margin with low order volume
                        (Puzzle quadrant).
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                          7-Day Replenishment Forecast
                        </span>
                        <span className="font-mono text-xs text-amber-800">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-amber-950 leading-relaxed">
                        Based on 14-day consumption velocity and recorded
                        spoilage, <strong>Fresh Goat Meat (Curry Cut)</strong>{" "}
                        and <strong>Byadgi Dry Red Chillies</strong> require
                        vendor reorder within 48 hours.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section
          data-gsap="reveal-section"
          className="py-16 lg:py-24 bg-white border-b border-[#E5E7EB]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-3 mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#176B52]">
                Engineered for Indian Hospitality
              </span>
              <h2 className="font-display text-fluid-h2 font-bold text-[#101820]">
                Why generic POS systems fail independent Indian restaurants
              </h2>
              <p className="text-sm sm:text-base text-[#64748B]">
                Every workflow in DinePilot was designed around real Indian
                kitchen and dining room operations—from multi-batch table KOTs
                to yield-adjusted masala & butcher costing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Layers,
                  title: "Running Table Sessions & Multi-KOT",
                  problem:
                    "Western QR apps force a brand-new checkout and tax invoice every time a table orders extra rotis.",
                  solution:
                    "DinePilot supports open table sessions where guests or waiters fire KOT #1, #2, and #3 into one running order and settle a single GST bill.",
                },
                {
                  icon: Scale,
                  title: "Yield-Adjusted Recipe & Waste Ledger",
                  problem:
                    "1 kg of raw onions or mutton bought ≠ 1 kg of usable ingredient in the pot after peeling and trimming.",
                  solution:
                    "Every ingredient tracks Usable Yield % alongside an auditable ledger for Spoilage, Prep Wastage, Staff Meals, and Order Consumption.",
                },
                {
                  icon: ReceiptIndianRupee,
                  title: "Configurable Indian GST & UPI Verification",
                  problem:
                    "Hardcoded tax percentages break when switching between 5% GST Exclusive, MRP Inclusive, or Composition schemes.",
                  solution:
                    "Full CGST + SGST split, optional service charge, packaging fee, ₹1 round-off, and honest PENDING_VERIFICATION UPI workflows.",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#E5E7EB] bg-[#F8F7F3] p-6 flex flex-col justify-between space-y-4 hover:shadow-editorial transition-shadow"
                  >
                    <div className="space-y-3">
                      <div className="h-10 w-10 rounded-xl bg-[#101820] text-[#20A67A] flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display font-bold text-lg text-[#101820]">
                        {item.title}
                      </h3>
                      <div className="rounded-xl bg-red-50/90 border border-red-200/80 p-3 text-xs text-red-900">
                        <span className="font-semibold block mb-0.5">
                          Typical Gap:
                        </span>
                        {item.problem}
                      </div>
                      <div className="rounded-xl bg-[#E8F3EF] border border-[#176B52]/20 p-3 text-xs text-[#101820]">
                        <span className="font-semibold text-[#176B52] block mb-0.5">
                          DinePilot Architecture:
                        </span>
                        {item.solution}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          data-gsap="reveal-section"
          className="py-16 lg:py-24 bg-[#F8F7F3] border-b border-[#E5E7EB]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#176B52]">
                  Five Integrated Product Surfaces
                </span>
                <h2 className="font-display text-fluid-h2 font-bold text-[#101820]">
                  Explore every live surface in one click
                </h2>
              </div>
              <Link
                href="/features"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#176B52] hover:underline"
              >
                Explore full technical specification
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  badge: "Surface 01 • Guest QR App",
                  title: "4-Theme Mobile QR Ordering & Live Tracker",
                  desc: "Switch between Botanical, Midnight, Terracotta, and Nordic themes. Supports VEG / NON-VEG / JAIN filters, Saoji spice badges, and running table KOTs.",
                  href: "/menu/saoji-spice-nagpur?table=tbl_saoji_t01",
                  cta: "Open Live Table T-01 QR Menu",
                  icon: QrCode,
                },
                {
                  badge: "Surface 02 • Kitchen Display (KDS)",
                  title: "Real-Time Socket.IO Kitchen Display",
                  desc: "High-contrast dark kitchen board with elapsed-time SLA indicators (<10m, 10–20m, >20m), KOT batch tickets, and one-tap status progression.",
                  href: "/kitchen",
                  cta: "Open Live Kitchen Display",
                  icon: ChefHat,
                },
                {
                  badge: "Surface 03 • Profitability Matrix",
                  title: "4-Quadrant Menu Engineering Engine",
                  desc: "Classifies every dish into Stars, Plowhorses, Puzzles, or Dogs using real order volume and yield-adjusted recipe contribution margins.",
                  href: "/app/analytics",
                  cta: "Inspect Profitability Matrix",
                  icon: BarChart3,
                },
                {
                  badge: "Surface 04 • AI Business Copilot",
                  title: "Grounded Operational & Margin Copilot",
                  desc: "Answers natural-language questions using your restaurant's live metrics and separates historical facts from 7-day replenishment forecasts.",
                  href: "/app/ai-insights",
                  cta: "Launch AI Business Copilot",
                  icon: BrainCircuit,
                },
                {
                  badge: "Surface 05 • Auditable Ledgers",
                  title: "Customer Loyalty & Inventory Ledgers",
                  desc: "Every point earned or redeemed and every gram of stock deducted or wasted is recorded in an immutable, idempotent transaction ledger.",
                  href: "/app/inventory",
                  cta: "Explore Stock & Loyalty Ledgers",
                  icon: Award,
                },
                {
                  badge: "Surface 06 • Multi-Tenant SaaS",
                  title: "Platform Admin & Role Permission Matrix",
                  desc: "Granular RBAC for Owner, Manager, Cashier, Kitchen, and Waiter roles, plus a Platform Superadmin console for subscriptions and audit logs.",
                  href: "/login",
                  cta: "Try Role-Based Demo Logins",
                  icon: ShieldCheck,
                },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card hover:shadow-editorial transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-[#F8F7F3] border border-[#E5E7EB] px-2.5 py-1 text-[11px] font-semibold text-[#176B52]">
                          {card.badge}
                        </span>
                        <Icon className="h-5 w-5 text-[#C6A15B]" />
                      </div>
                      <h3 className="font-display font-bold text-lg text-[#101820]">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <Link
                      href={card.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B52] hover:text-[#125541] group"
                    >
                      <span>{card.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          data-gsap="reveal-section"
          className="py-16 lg:py-20 bg-navy-mesh text-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-white/15 bg-[#182430]/90 p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-navy">
              <div className="space-y-3 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/40 px-3 py-1 text-xs font-semibold text-[#C6A15B]">
                  Seeded Flagship Workspace • Dharampeth, Nagpur
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold">
                  Explore “Saoji & Spice Kitchen (Demo)” right now
                </h2>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Pre-loaded with authentic Vidarbha & Indian menu categories,
                  yield-adjusted recipes, 30 days of historical orders, active
                  kitchen tickets, and multi-role staff accounts.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 shrink-0">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-5 py-3 text-sm font-bold text-white hover:bg-[#125541] transition-colors shadow-sm"
                >
                  One-Click Demo Login
                  <ArrowRight className="h-4 w-4 text-[#20A67A]" />
                </Link>
                <Link
                  href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Open Guest QR Menu
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
