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
  Clock,
  Smartphone,
  BellRing,
  CheckCircle2,
  ChevronDown,
  Utensils,
  SlidersHorizontal,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { formatINR } from "@dinepilot/shared";

const ORDER_FLOW_STEPS = [
  {
    id: 0,
    step: "01",
    shortLabel: "Scan QR",
    title: "Customer scans table QR code",
    actor: "Guest at Table T-01",
    surface: "Mobile Browser (No App Download)",
    summary:
      "Guest points their phone camera at the table tent QR code. DinePilot verifies the cryptographic table token and opens the restaurant menu in under a second.",
    previewBadge: "TABLE T-01 VERIFIED • INDOOR AC ZONE",
    previewItems: [
      { label: "Restaurant", value: "Saoji & Spice Kitchen, Nagpur" },
      { label: "Session Mode", value: "Running Table Session (Multi-KOT)" },
      { label: "App Install Required", value: "None — Instant Mobile Web" },
    ],
    ctaHref: "/menu/saoji-spice-nagpur?table=tbl_saoji_t01",
    ctaLabel: "Open Live Table T-01 QR Menu",
  },
  {
    id: 1,
    step: "02",
    shortLabel: "Browse & Customise",
    title: "Guest browses digital menu & customises dishes",
    actor: "Guest Diner",
    surface: "/menu/saoji-spice-nagpur",
    summary:
      "Guests filter by Pure Veg, Jain, or Bestsellers, choose portion variants (Half / Full Handi), select add-ons, and add cooking notes for the kitchen.",
    previewBadge: "CUSTOMISATION SHEET • INTEGER PAISE PRICING",
    previewItems: [
      { label: "Selected Dish", value: "Nagpuri Saoji Mutton Handi (₹460)" },
      { label: "Dietary / Spice", value: "NON-VEG • SAOJI FIERY" },
      { label: "Chef Instruction", value: "Serve starters first, extra lemon" },
    ],
    ctaHref: "/menu/saoji-spice-nagpur?table=tbl_saoji_t01",
    ctaLabel: "Try Dish Customisation",
  },
  {
    id: 2,
    step: "03",
    shortLabel: "Submit Order",
    title: "Guest reviews GST bill & submits order",
    actor: "Guest Diner or Waiter (Staff Fallback)",
    surface: "/menu/saoji-spice-nagpur/cart",
    summary:
      "The server validates item availability, calculates itemized CGST + SGST and round-off in integer paise, and dispatches KOT Batch #1 idempotently.",
    previewBadge: "IDEMPOTENT ORDER SUBMISSION • KOT #1",
    previewItems: [
      { label: "Item Subtotal", value: "₹620.00" },
      { label: "CGST (2.5%) + SGST (2.5%)", value: "₹31.00" },
      { label: "Payable Grand Total", value: "₹651.00 (Rounded)" },
    ],
    ctaHref: "/menu/saoji-spice-nagpur/cart?table=tbl_saoji_t01",
    ctaLabel: "Inspect Cart & GST Breakdown",
  },
  {
    id: 3,
    step: "04",
    shortLabel: "Staff Receives",
    title: "Owner & floor staff receive live order alert",
    actor: "Floor Manager / Cashier",
    surface: "/app/orders",
    summary:
      "Order #DP-1012 appears immediately on the Order Desk via Socket.IO. Staff can accept the order, append items via Staff POS fallback, or verify payment.",
    previewBadge: "ORDER DESK • LIVE SOCKET.IO QUEUE",
    previewItems: [
      { label: "Ticket ID", value: "#DP-1012 • Table T-01" },
      { label: "State Transition", value: "NEW → ACCEPTED (Validates Stock)" },
      { label: "Fallback Mode", value: "Staff-Assisted POS Available Anytime" },
    ],
    ctaHref: "/app/orders",
    ctaLabel: "Open Owner Order Desk",
  },
  {
    id: 4,
    step: "05",
    shortLabel: "Kitchen Prepares",
    title: "Kitchen prepares ticket on high-contrast KDS",
    actor: "Head Chef / Line Cook",
    surface: "/kitchen",
    summary:
      "Accepting the order automatically deducts yield-adjusted recipe ingredients once and routes the KOT ticket to the dark-slate Kitchen Display System.",
    previewBadge: "KITCHEN DISPLAY SYSTEM • SLA <10M ON-TIME",
    previewItems: [
      { label: "KDS Status", value: "ACCEPTED → PREPARING" },
      { label: "Recipe Stock Deduction", value: "Mutton, Onion, Saoji Masala" },
      { label: "Elapsed SLA Timer", value: "06m • Emerald On-Time Indicator" },
    ],
    ctaHref: "/kitchen",
    ctaLabel: "Open Live Kitchen Display (KDS)",
  },
  {
    id: 5,
    step: "06",
    shortLabel: "Mark Ready & Track",
    title: "Staff marks ready & guest tracker updates live",
    actor: "Kitchen & Guest Tracker",
    surface: "/order/ord_demo_preparing_1010",
    summary:
      "When the chef taps 'Mark Ready', the guest's live order status page updates in real time without refreshing, and the waiter serves the table.",
    previewBadge: "REAL-TIME GUEST TRACKER • 6-STAGE STEPPER",
    previewItems: [
      { label: "Live Status", value: "PREPARING → READY TO SERVE → COMPLETED" },
      { label: "Repeat Ordering", value: "Guest can fire KOT #2 on same bill" },
      { label: "Payment Verification", value: "Cashier confirms UPI / Cash" },
    ],
    ctaHref: "/order/ord_demo_preparing_1010",
    ctaLabel: "View Live Guest Order Tracker",
  },
];

const FAQ_ITEMS = [
  {
    q: "Do customers need to download an app to scan the QR code and order?",
    a: "No. Customers scan the table QR code with their standard phone camera and the digital menu opens immediately in their mobile browser. No app store download or account creation is required.",
  },
  {
    q: "What if a guest prefers to order through a waiter instead of scanning the QR code?",
    a: "DinePilot includes a built-in Staff-Assisted POS modal inside the Order Desk (/app/orders). Waiters or cashiers can punch in new table orders or append additional KOT batches to an existing running table at any time.",
  },
  {
    q: "How does Running Table / Multi-KOT ordering work during a meal?",
    a: "In full-service restaurants, guests order starters first, main course and extra rotis later, and desserts at the end. DinePilot groups each round as KOT Batch #1, #2, and #3 under one active table order so the kitchen receives separate prep tickets while the guest settles a single consolidated GST bill.",
  },
  {
    q: "How are ingredient stock deductions and recipe costs calculated?",
    a: "Each menu item can be linked to a recipe card with ingredient quantities and usable yield percentages (accounting for peeling or trimming loss). When an order transitions to ACCEPTED, DinePilot idempotently deducts the required raw stock and logs an auditable inventory movement.",
  },
  {
    q: "How are UPI and counter payments handled?",
    a: "Guests can choose Pay After Meal, Cash at Table, or UPI Deep-Link/QR. To prevent spoofed browser confirmations, guest UPI claims are marked PENDING_VERIFICATION until verified by your cashier or a signed payment webhook.",
  },
];

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const [selectedDemoDish, setSelectedDemoDish] = useState<
    "mutton" | "paneer" | "patodi"
  >("mutton");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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
          y: 12,
          opacity: 0,
          duration: 0.4,
        })
        .from(
          "[data-gsap='hero-title']",
          { y: 18, opacity: 0, duration: 0.5 },
          "-=0.2"
        )
        .from(
          "[data-gsap='hero-lead']",
          { y: 14, opacity: 0, duration: 0.45 },
          "-=0.25"
        )
        .from(
          "[data-gsap='hero-cta']",
          { y: 12, opacity: 0, duration: 0.4 },
          "-=0.25"
        )
        .from(
          "[data-gsap='hero-preview']",
          { y: 20, opacity: 0, duration: 0.55 },
          "-=0.35"
        );

      gsap.utils
        .toArray<HTMLElement>("[data-gsap='reveal-section']")
        .forEach((sec) => {
          gsap.from(sec, {
            y: 24,
            opacity: 0,
            duration: 0.55,
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
      quadrantLabel: "Star Performer (High Volume • High Gross Profit)",
      note: "10% butcher trim & 15% onion peeling loss factored into real recipe cost.",
    },
    paneer: {
      name: "Varhadi Roasted Paneer Masala",
      sellingPaise: 34000,
      rawIngredientPaise: 9200,
      yieldAdjustedPaise: 9600,
      packagingPaise: 1500,
      quadrantLabel: "Star Performer (72% Gross Margin)",
      note: "High repeat demand with predictable dairy & spice unit economics.",
    },
    patodi: {
      name: "Traditional Patodi Rassa",
      sellingPaise: 28000,
      rawIngredientPaise: 4100,
      yieldAdjustedPaise: 4400,
      packagingPaise: 1500,
      quadrantLabel: "Puzzle (High Margin • Upsell Opportunity)",
      note: "84% gross margin. Ideal candidate for QR cart pairing.",
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

  const currentFlow = ORDER_FLOW_STEPS[activeFlowStep];

  return (
    <MarketingLayout>
      <div ref={rootRef}>
        <section className="relative overflow-hidden bg-[#121715] text-[#F8F7F3] border-b border-white/10 pt-14 pb-20 lg:pt-20 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div
                  data-gsap="hero-badge"
                  className="inline-flex items-center gap-2 rounded-full border border-[#20A67A]/30 bg-[#176B52]/20 px-3.5 py-1.5 text-xs font-semibold text-[#F8F7F3]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#20A67A]" />
                  <span>
                    QR Table Ordering • Live Kitchen Display • Margin Analytics
                  </span>
                </div>

                <h1
                  data-gsap="hero-title"
                  className="font-display text-fluid-hero font-bold tracking-tight text-white"
                >
                  From QR scan to kitchen ticket—and{" "}
                  <span className="text-[#20A67A]">
                    real dish profitability.
                  </span>
                </h1>

                <p
                  data-gsap="hero-lead"
                  className="text-base sm:text-lg text-[#94A3B8] max-w-xl leading-relaxed"
                >
                  Give guests an effortless, browser-based QR menu while your
                  team runs live orders, a glanceable Kitchen Display System,
                  staff POS fallback, and yield-adjusted recipe costing from one
                  calm workspace.
                </p>

                <div
                  data-gsap="hero-cta"
                  className="flex flex-wrap items-center gap-3.5 pt-1"
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#125541] transition-colors shadow-card"
                  >
                    Launch Live Demo Workspace
                    <ArrowRight className="h-4 w-4 text-[#20A67A]" />
                  </Link>
                  <Link
                    href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    <QrCode className="h-4 w-4 text-[#20A67A]" />
                    Try Customer QR Menu
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-xs text-[#94A3B8]">
                  <div>
                    <p className="font-mono font-bold text-sm text-white">
                      No App Install
                    </p>
                    <p className="mt-0.5">Instant mobile web QR menu</p>
                  </div>
                  <div>
                    <p className="font-mono font-bold text-sm text-white">
                      Live KDS Sync
                    </p>
                    <p className="mt-0.5">Real-time Socket.IO tickets</p>
                  </div>
                  <div>
                    <p className="font-mono font-bold text-sm text-white">
                      Staff POS Fallback
                    </p>
                    <p className="mt-0.5">Waiter-assisted ordering built in</p>
                  </div>
                </div>
              </div>

              <div data-gsap="hero-preview" className="lg:col-span-6">
                <div className="rounded-2xl border border-white/15 bg-white text-[#121715] p-5 sm:p-6 shadow-navy space-y-5">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3.5">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B52]">
                        Interactive Service Workflow
                      </span>
                      <h2 className="font-display font-bold text-base sm:text-lg text-[#121715]">
                        Click any stage from QR scan to kitchen completion
                      </h2>
                    </div>
                    <span className="rounded-md bg-[#E8F3EF] px-2.5 py-1 font-mono text-[11px] font-bold text-[#176B52]">
                      Step {currentFlow.step} / 06
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-[#F8F7F3] p-1.5 rounded-xl border border-[#E5E7EB]">
                    {ORDER_FLOW_STEPS.map((st) => {
                      const active = activeFlowStep === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setActiveFlowStep(st.id)}
                          className={`relative rounded-lg px-2 py-2 text-center transition-colors z-10 ${
                            active
                              ? "text-white font-bold"
                              : "text-[#64748B] hover:text-[#121715] font-medium"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="hero-flow-step-pill"
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className="absolute inset-0 rounded-lg bg-[#176B52] -z-10"
                            />
                          )}
                          <span className="block font-mono text-[10px] opacity-80">
                            {st.step}
                          </span>
                          <span className="block text-[11px] truncate">
                            {st.shortLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentFlow.id}
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
                      className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] p-4 space-y-3.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-md bg-[#E8F3EF] border border-[#176B52]/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#176B52]">
                          {currentFlow.previewBadge}
                        </span>
                        <span className="font-mono text-[11px] text-[#64748B]">
                          {currentFlow.surface}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display font-bold text-base text-[#121715]">
                          {currentFlow.title}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                          {currentFlow.summary}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {currentFlow.previewItems.map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between rounded-lg bg-white border border-[#E5E7EB] px-3 py-2 text-xs"
                          >
                            <span className="text-[#64748B] font-medium">
                              {row.label}
                            </span>
                            <span className="font-mono font-semibold text-[#121715]">
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] text-[#64748B]">
                          Actor: <strong>{currentFlow.actor}</strong>
                        </span>
                        <Link
                          href={currentFlow.ctaHref}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#176B52] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#125541] transition-colors"
                        >
                          {currentFlow.ctaLabel}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="qr-ordering"
          data-gsap="reveal-section"
          className="py-16 lg:py-24 bg-[#F8F7F3] border-b border-[#E5E7EB]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#176B52]">
                01 • QR Ordering & Digital Menu
              </span>
              <h2 className="font-display text-fluid-h2 font-bold text-[#121715]">
                Frictionless table ordering for guests, total control for staff
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                Customers scan the QR code at their table to browse categories,
                customise portions, and fire orders straight to your kitchen—with
                staff-assisted ordering always available as a seamless fallback.
              </p>
            </div>

            <div
              id="digital-menu"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                {
                  icon: QrCode,
                  badge: "Zero App Friction",
                  title: "Table-Aware QR Menu & Pin Security",
                  desc: "Each table has its own unique QR token and rotatable session PIN. Guests scan to order for Dine-In, Takeaway, or Delivery without installing any app.",
                  linkHref: "/menu/saoji-spice-nagpur?table=tbl_saoji_t01",
                  linkText: "Preview Guest QR Menu →",
                },
                {
                  icon: SlidersHorizontal,
                  badge: "Digital Menu & Customisations",
                  title: "Dietary Tags, Spice Levels & Variants",
                  desc: "Highlight VEG, NON-VEG, JAIN, and VEGAN dishes, configure Half/Full portions and optional add-ons, and toggle 86'd items out of stock in one click.",
                  linkHref: "/app/menu",
                  linkText: "Explore Menu Manager →",
                },
                {
                  icon: Layers,
                  badge: "Running Table Sessions",
                  title: "Multi-KOT Ordering on a Single Bill",
                  desc: "Guests or waiters can append KOT Batch #2 and #3 (extra rotis, beverages, desserts) to an active table order and settle one consolidated GST invoice.",
                  linkHref: "/order/ord_demo_preparing_1010",
                  linkText: "Inspect Multi-KOT Tracker →",
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card hover:shadow-editorial transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-[#E8F3EF] px-2.5 py-1 text-[11px] font-semibold text-[#176B52]">
                          {card.badge}
                        </span>
                        <div className="h-9 w-9 rounded-xl bg-[#F8F7F3] text-[#176B52] flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg text-[#121715]">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                    <Link
                      href={card.linkHref}
                      className="text-xs font-semibold text-[#176B52] hover:underline"
                    >
                      {card.linkText}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="kitchen-workflow"
          data-gsap="reveal-section"
          className="py-16 lg:py-24 bg-white border-b border-[#E5E7EB]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl space-y-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#176B52]">
                  02 • Restaurant Operations & Kitchen Workflow
                </span>
                <h2 className="font-display text-fluid-h2 font-bold text-[#121715]">
                  Designed for high-volume service clarity
                </h2>
                <p className="text-sm text-[#64748B]">
                  Owners find live orders immediately on the Order Desk while
                  line cooks read high-contrast tickets at a glance on the
                  Kitchen Display System.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/app/orders"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541]"
                >
                  Open Live Order Desk
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/kitchen"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-4 py-2.5 text-xs font-semibold text-[#121715] hover:bg-[#E8F3EF]"
                >
                  <ChefHat className="h-4 w-4 text-[#176B52]" />
                  Open Kitchen Display (KDS)
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-6 rounded-2xl border border-[#E5E7EB] bg-[#F8F7F3] p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-white border border-[#E5E7EB] px-2.5 py-1 text-[11px] font-bold text-[#176B52]">
                      OWNER & CASHIER ORDER DESK
                    </span>
                    <span className="font-mono text-xs text-[#64748B]">
                      /app/orders
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#121715]">
                    Instant order triage, state transitions & Staff POS fallback
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Filter active tickets by status, punch in phone or walk-in
                    orders with the Staff POS modal, and verify Cash or UPI
                    payments with a complete audit trail.
                  </p>
                </div>

                <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#121715]">
                        #DP-1010
                      </span>
                      <span className="rounded bg-[#E8F3EF] px-2 py-0.5 text-[10px] font-bold text-[#176B52]">
                        Table T-01
                      </span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        PREPARING
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#121715]">
                      ₹714
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>1× Saoji Mutton Handi, 4× Butter Roti (2 KOTs)</span>
                    <span className="font-semibold text-[#176B52]">
                      Mark Ready →
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 rounded-2xl border border-[#121715] bg-[#121715] text-white p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-[#176B52] px-2.5 py-1 text-[11px] font-bold text-white">
                      GLANCEABLE KITCHEN DISPLAY (KDS)
                    </span>
                    <span className="font-mono text-xs text-[#94A3B8]">
                      /kitchen
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-white">
                    High-contrast tickets with elapsed-time SLA indicators
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Color-coded timers (&lt;10m Emerald, 10–20m Amber, &gt;20m
                    Crimson), clear dietary & Jain prep callouts, and large
                    touch targets designed for busy kitchen lines.
                  </p>
                </div>

                <div className="rounded-xl border border-white/15 bg-[#1A221F] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">
                        #DP-1010 • TABLE T-01
                      </span>
                      <span className="rounded bg-[#20A67A]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#20A67A]">
                        KOT #2
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded bg-[#20A67A] px-2 py-0.5 font-mono text-[10px] font-bold text-[#121715]">
                      <Clock className="h-3 w-3" /> 06m ON-TIME
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#F8F7F3]">
                    <span>1× Nagpuri Saoji Mutton Handi (SAOJI FIERY)</span>
                    <span className="rounded bg-[#176B52] px-2.5 py-1 text-[11px] font-bold">
                      Ready →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="analytics-intelligence"
          data-gsap="reveal-section"
          className="py-16 lg:py-24 bg-[#F8F7F3] border-b border-[#E5E7EB]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#176B52]">
                  03 • Analytics, Inventory & Recipe Costing Intelligence
                </span>
                <h2 className="font-display text-fluid-h2 font-bold text-[#121715]">
                  Know your exact food cost and dish margin on every order
                </h2>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Beyond daily sales reports, DinePilot connects your menu items
                  to yield-adjusted ingredient recipes, a 4-quadrant
                  profitability matrix (Stars, Plowhorses, Puzzles, Dogs), and
                  an auditable stock & waste ledger.
                </p>

                <ul className="space-y-2.5 text-xs text-[#121715]">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#176B52] shrink-0" />
                    <span>
                      <strong>4-Quadrant Menu Engineering:</strong> Automatically
                      classify dishes by order volume and net contribution
                      margin.
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#176B52] shrink-0" />
                    <span>
                      <strong>Yield-Adjusted Recipe Costing:</strong> Factor in
                      onion peeling or butcher trimming loss (`usableYieldPercent`).
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#176B52] shrink-0" />
                    <span>
                      <strong>Auditable Stock & Waste Ledger:</strong> Track
                      opening stock, restocks, order consumption, spoilage, and
                      staff meals.
                    </span>
                  </li>
                </ul>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/app/analytics"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541]"
                  >
                    Open Profitability Matrix
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/app/recipes"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-xs font-semibold text-[#121715] hover:bg-[#E8F3EF]"
                  >
                    Inspect Recipe Costing
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-editorial space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3.5">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B52]">
                      Live Dish Margin Simulator
                    </span>
                    <h3 className="font-display font-bold text-base text-[#121715]">
                      Yield-Adjusted Unit Economics
                    </h3>
                  </div>
                  <div className="inline-flex rounded-lg bg-[#F8F7F3] p-1 border border-[#E5E7EB]">
                    {(
                      [
                        { id: "mutton", label: "Saoji Mutton" },
                        { id: "paneer", label: "Varhadi Paneer" },
                        { id: "patodi", label: "Patodi Rassa" },
                      ] as const
                    ).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDemoDish(d.id)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          selectedDemoDish === d.id
                            ? "bg-[#176B52] text-white"
                            : "text-[#64748B] hover:text-[#121715]"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[#F8F7F3] border border-[#E5E7EB] p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-sm text-[#121715]">
                    <span>{activeDish.name}</span>
                    <span className="font-mono text-[#176B52]">
                      {formatINR(activeDish.sellingPaise)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Naive Raw Ingredient Cost</span>
                    <span className="font-mono line-through">
                      {formatINR(activeDish.rawIngredientPaise)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-[#121715]">
                    <span>Yield-Adjusted Recipe Cost</span>
                    <span className="font-mono text-amber-800">
                      {formatINR(activeDish.yieldAdjustedPaise)} ({foodCostPct}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Packaging Allocation</span>
                    <span className="font-mono">
                      {formatINR(activeDish.packagingPaise)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-center font-bold text-sm">
                    <span className="text-[#121715]">
                      Gross Profit Contribution
                    </span>
                    <span className="font-mono text-[#20A67A]">
                      +{formatINR(grossProfitPaise)} / order
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#64748B]">
                  <strong className="text-[#176B52]">
                    {activeDish.quadrantLabel}:
                  </strong>{" "}
                  {activeDish.note}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="faq"
          data-gsap="reveal-section"
          className="py-16 lg:py-24 bg-white border-b border-[#E5E7EB]"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#176B52]">
                Frequently Asked Questions
              </span>
              <h2 className="font-display text-fluid-h2 font-bold text-[#121715]">
                Everything you need to know about running DinePilot
              </h2>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={item.q}
                    className="rounded-2xl border border-[#E5E7EB] bg-[#F8F7F3] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-display font-bold text-sm sm:text-base text-[#121715] hover:bg-white transition-colors"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-[#176B52] shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-[#E5E7EB] bg-white">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          data-gsap="reveal-section"
          className="py-16 lg:py-20 bg-[#121715] text-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-white/15 bg-[#1A221F] p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-2.5 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#176B52]/30 border border-[#20A67A]/30 px-2.5 py-1 text-xs font-semibold text-[#20A67A]">
                  Interactive Live Sandbox • Ready to Test
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold">
                  Test the full order flow from Guest QR to Kitchen Display
                </h2>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Open the customer QR menu to place a test order, or sign into
                  the Owner Workspace in one click to manage tables, menus, and
                  live kitchen tickets.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 shrink-0">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#125541] transition-colors"
                >
                  One-Click Demo Sign In
                  <ArrowRight className="h-4 w-4 text-[#20A67A]" />
                </Link>
                <Link
                  href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Open Table T-01 QR Menu
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Book a Guided Demo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
