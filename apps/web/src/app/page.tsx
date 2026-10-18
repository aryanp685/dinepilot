"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { formatINR } from "@dinepilot/shared";

export default function HomePage() {
  const [selectedDemoDish, setSelectedDemoDish] = useState<
    "mutton" | "paneer" | "patodi"
  >("mutton");

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
      <section className="relative overflow-hidden border-b border-[#E5E0D5] pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0F291E]/15 bg-[#E6ECE8] px-3.5 py-1.5 text-xs font-semibold text-[#0F291E]">
                <Sparkles className="h-3.5 w-3.5 text-[#D97706]" />
                <span>
                  Restaurant Profitability, Inventory & QR Operations Platform
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-[#0F291E] leading-[1.08]">
                Don’t just take orders.{" "}
                <span className="text-[#286249] underline decoration-[#D97706]/50 decoration-wavy underline-offset-8">
                  Know which dishes make money.
                </span>
              </h1>

              <p className="text-lg text-[#4A5950] max-w-2xl leading-relaxed">
                Most restaurant software stops after printing a bill.{" "}
                <strong className="text-[#111C16] font-semibold">
                  DinePilot
                </strong>{" "}
                connects your mobile QR table ordering and kitchen display
                directly to yield-adjusted recipe costing, auditable ingredient
                stock ledgers, Indian GST compliance, and an AI Business
                Copilot.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0F291E] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#163829] transition-all shadow-editorial"
                >
                  Launch Interactive Demo Workspace
                  <ArrowRight className="h-4 w-4 text-[#84CC16]" />
                </Link>
                <Link
                  href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#0F291E]/25 bg-white px-5 py-3.5 text-sm font-semibold text-[#0F291E] hover:bg-[#F2EFE9] transition-colors"
                >
                  <QrCode className="h-4 w-4 text-[#D97706]" />
                  Try Guest QR Menu (Table T-01)
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E5E0D5] text-xs text-[#4A5950]">
                <div>
                  <p className="font-mono font-bold text-base text-[#0F291E]">
                    Integer Paise
                  </p>
                  <p>Zero floating-point drift across GST & recipes</p>
                </div>
                <div>
                  <p className="font-mono font-bold text-base text-[#0F291E]">
                    Multi-KOT QR
                  </p>
                  <p>Running table bills for repeat dine-in rounds</p>
                </div>
                <div>
                  <p className="font-mono font-bold text-base text-[#0F291E]">
                    Yield-Aware
                  </p>
                  <p>Accounts for peeling & butcher shrinkage</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[#0F291E]/15 bg-white p-6 shadow-editorial space-y-5">
                <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D97706]">
                      Interactive Unit Economics Preview
                    </span>
                    <h2 className="font-display font-bold text-lg text-[#0F291E]">
                      Live Dish Margin Inspector
                    </h2>
                  </div>
                  <span className="rounded-md bg-[#E6ECE8] px-2.5 py-1 font-mono text-xs font-semibold text-[#0F291E]">
                    INR • Asia/Kolkata
                  </span>
                </div>

                <div className="flex gap-2">
                  {(["mutton", "paneer", "patodi"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDemoDish(key)}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                        selectedDemoDish === key
                          ? "bg-[#0F291E] text-white"
                          : "bg-[#F2EFE9] text-[#4A5950] hover:text-[#0F291E]"
                      }`}
                    >
                      {key === "mutton"
                        ? "Saoji Mutton"
                        : key === "paneer"
                        ? "Varhadi Paneer"
                        : "Patodi Rassa"}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl bg-[#FBF9F5] border border-[#E5E0D5] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#111C16]">
                      {activeDish.name}
                    </span>
                    <span className="font-mono font-bold text-base text-[#0F291E]">
                      {formatINR(activeDish.sellingPaise)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="rounded-lg bg-white p-3 border border-[#E5E0D5]">
                      <span className="text-[#718077] block">
                        Yield-Adjusted Food Cost
                      </span>
                      <span className="font-mono font-bold text-sm text-[#111C16] mt-0.5 block">
                        {formatINR(activeDish.yieldAdjustedPaise)} ({foodCostPct}
                        %)
                      </span>
                      <span className="text-[11px] text-[#B45309] mt-0.5 block">
                        Raw unpeeled: {formatINR(activeDish.rawIngredientPaise)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-white p-3 border border-[#E5E0D5]">
                      <span className="text-[#718077] block">
                        Est. Gross Profit / Serving
                      </span>
                      <span className="font-mono font-bold text-sm text-emerald-700 mt-0.5 block">
                        {formatINR(grossProfitPaise)}
                      </span>
                      <span className="text-[11px] text-[#4A5950] mt-0.5 block">
                        After {formatINR(activeDish.packagingPaise)} packaging
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F291E]">
                      {activeDish.quadrantLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5950] leading-relaxed">
                    {activeDish.note}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-[#0F291E] hover:underline inline-flex items-center gap-1"
                  >
                    Inspect full recipe ledger in Dashboard
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/kitchen"
                    className="text-xs font-semibold text-[#D97706] hover:underline inline-flex items-center gap-1"
                  >
                    Open Kitchen KDS
                    <ChefHat className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-[#E5E0D5] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D97706]">
              Differentiator 01 • AI Business Copilot
            </span>
            <h2 className="font-display text-3xl font-bold text-[#0F291E]">
              Deterministic restaurant metrics first. Explainable intelligence
              second.
            </h2>
            <p className="text-[#4A5950] text-base leading-relaxed">
              DinePilot never allows an LLM to invent sales numbers or run raw
              queries against your database. The backend calculates exact
              paise-level margins, burn rates, and spoilage trends first—then
              synthesizes actionable operational guidance.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-[#E5E0D5] bg-[#FBF9F5] p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-[#0F291E] text-[#84CC16] flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#0F291E]">
                Plowhorse Margin Alerts
              </h3>
              <p className="text-sm text-[#4A5950] leading-relaxed">
                Automatically detects dishes with high order volume but weak
                gross margin percentages and calculates the exact price or
                portion adjustment required.
              </p>
            </div>

            <div className="rounded-xl border border-[#E5E0D5] bg-[#FBF9F5] p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-[#0F291E] text-[#84CC16] flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#0F291E]">
                7-Day Replenishment Runway
              </h3>
              <p className="text-sm text-[#4A5950] leading-relaxed">
                Estimates daily ingredient burn from historical recipe
                consumption and flags stockouts before Friday dinner service
                begins.
              </p>
            </div>

            <div className="rounded-xl border border-[#E5E0D5] bg-[#FBF9F5] p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-[#0F291E] text-[#84CC16] flex items-center justify-center">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#0F291E]">
                Natural-Language Metric Q&A
              </h3>
              <p className="text-sm text-[#4A5950] leading-relaxed">
                Ask questions like{" "}
                <em>
                  “Which five dishes generated the highest gross profit this
                  month?”
                </em>{" "}
                and receive answers grounded strictly in your stored ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-[#E5E0D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#286249]">
              Unified Multi-Tenant Architecture
            </span>
            <h2 className="font-display text-3xl font-bold text-[#0F291E]">
              Every operational workflow inside a single source of truth
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Scale,
                badge: "Inventory & Recipes",
                title: "Yield-Adjusted Recipe Costing & Stock Ledger",
                desc: "Every purchase, manual adjustment, spoilage, waste event, and accepted order generates an immutable movement record with concurrency-safe stock guards.",
              },
              {
                icon: QrCode,
                badge: "Guest QR Ordering",
                title: "4 Theme Presets & Running Table Multi-KOTs",
                desc: "Signed table QR tokens, repeat KOT ordering on occupied dine-in tables, Indian dietary filters (Pure Veg, Non-Veg, Jain, Vegan), and server-recalculated totals.",
              },
              {
                icon: ChefHat,
                badge: "Kitchen Operations",
                title: "Real-Time Socket.IO Kitchen Display (KDS)",
                desc: "Touch-friendly KDS cards with elapsed-time SLA timers, spice level indicators, modifier breakdowns, and instant guest order status broadcasts.",
              },
              {
                icon: BarChart3,
                badge: "Menu Profitability Engine",
                title: "4-Quadrant Menu Engineering Matrix",
                desc: "Distinguish Stars, Plowhorses, Puzzles, and Dogs across date ranges and order types, with transparent flags for items missing recipe definitions.",
              },
              {
                icon: Award,
                badge: "Customer Retention",
                title: "Auditable Loyalty Ledger & Consent Controls",
                desc: "Immutable EARN, REDEEM, and REVERSAL point transactions, Bronze-to-Platinum tiers, and explicit guest opt-in for promotional messaging.",
              },
              {
                icon: ReceiptIndianRupee,
                badge: "Indian Financial Compliance",
                title: "GST Modes, ₹1 Round-Off & UPI Verification",
                desc: "Supports Regular 5% GST (2.5% CGST + 2.5% SGST), Tax-Inclusive MRP, and Composition Scheme—plus NPCI UPI QR deep links with cashier verification.",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#E5E0D5] bg-white p-6 shadow-card flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-[#E6ECE8] px-2.5 py-1 text-[11px] font-semibold text-[#0F291E]">
                        {feature.badge}
                      </span>
                      <Icon className="h-5 w-5 text-[#0F291E]" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-[#111C16]">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[#4A5950] leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-[#E5E0D5] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D97706]">
              Transparent INR Pricing
            </span>
            <h2 className="font-display text-3xl font-bold text-[#0F291E]">
              Built for independent cafés, cloud kitchens, and dining rooms
            </h2>
            <p className="text-sm text-[#4A5950]">
              Zero per-order commission on your QR tables. Upgrade or switch
              plans anytime from your workspace billing settings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "₹999",
                period: "/ month",
                desc: "For compact cafés, QSR counters, and cloud kitchens starting structured operations.",
                features: [
                  "Up to 15 QR Dine-in Tables",
                  "Order State Machine & Live KDS",
                  "Indian GST Billing (Exclusive, Inclusive, Composition)",
                  "Ingredient Inventory & Purchase Ledger",
                  "CSV Financial & Sales Exports",
                ],
                highlight: false,
              },
              {
                name: "Growth",
                price: "₹2,499",
                period: "/ month",
                desc: "Full profitability, yield recipe costing, loyalty ledger, and AI Business Copilot.",
                features: [
                  "Up to 50 QR Dine-in Tables + Multi-KOT Sessions",
                  "Yield-Adjusted Recipe Costing Engine",
                  "4-Quadrant Menu Profitability Matrix",
                  "AI Business Copilot & Replenishment Forecasts",
                  "Auditable Customer Loyalty & Tier Ledger",
                  "Conflict-Safe Table Reservations",
                ],
                highlight: true,
              },
              {
                name: "Scale",
                price: "₹4,999",
                period: "/ month",
                desc: "For high-volume multi-zone restaurants and regional hospitality groups.",
                features: [
                  "Up to 200 QR Dine-in Tables",
                  "Multi-Workspace Owner Switching",
                  "Granular Role Permission Matrix & Audit Logs",
                  "Priority Webhook & ERP Export Adapters",
                  "Dedicated Onboarding & Recipe Costing Audit",
                ],
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-7 flex flex-col justify-between ${
                  plan.highlight
                    ? "border-[#0F291E] bg-[#0F291E] text-white shadow-editorial"
                    : "border-[#E5E0D5] bg-[#FBF9F5] text-[#111C16]"
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-xl">
                      {plan.name}
                    </h3>
                    {plan.highlight && (
                      <span className="rounded-full bg-[#84CC16] px-3 py-0.5 text-xs font-bold text-[#0F291E]">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold">
                      {plan.price}
                    </span>
                    <span
                      className={`text-xs ${
                        plan.highlight ? "text-[#E6ECE8]/70" : "text-[#4A5950]"
                      }`}
                    >
                      {plan.period} + GST
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${
                      plan.highlight ? "text-[#E6ECE8]/85" : "text-[#4A5950]"
                    }`}
                  >
                    {plan.desc}
                  </p>
                  <ul className="space-y-2.5 pt-2 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            plan.highlight
                              ? "text-[#84CC16]"
                              : "text-[#0F291E]"
                          }`}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href="/register"
                    className={`w-full inline-flex items-center justify-center rounded-xl py-3 px-4 text-sm font-semibold transition-colors ${
                      plan.highlight
                        ? "bg-[#84CC16] text-[#0F291E] hover:bg-[#9BE028]"
                        : "bg-[#0F291E] text-white hover:bg-[#163829]"
                    }`}
                  >
                    Start with {plan.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#286249]">
              Operational FAQ
            </span>
            <h2 className="font-display text-3xl font-bold text-[#0F291E]">
              Questions restaurant owners ask before switching
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "How does DinePilot prevent fake QR orders or unverified payment screenshots?",
                a: "Guest QR orders enter the NEW state first and only deduct recipe inventory when your staff accepts them (or when a table session PIN is verified). When a guest submits a UPI reference, the order enters PENDING_VERIFICATION—never PAID—until verified by your cashier or a signed gateway webhook.",
              },
              {
                q: "Can dine-in guests order multiple rounds (Starters first, Rotis later) on one bill?",
                a: "Yes. DinePilot supports Running Table KOTs. When a guest scans the table QR for a second round, items are appended as KOT #2 to the active table order and consolidated into a single GST invoice.",
              },
              {
                q: "When is ingredient inventory deducted, and what happens if an order is retried or cancelled?",
                a: "Inventory is deducted atomically when an order transitions to ACCEPTED, keyed by an idempotency key so retries never double-deduct stock. If an accepted order is later cancelled, DinePilot logs an explicit RETURN_REVERSAL movement.",
              },
              {
                q: "Does the AI Copilot send our raw database to an external LLM?",
                a: "No. All financial and inventory metrics are calculated deterministically on the backend first. When no external AI key is configured, DinePilot runs its built-in Deterministic Rule-Based Insights Engine.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#E5E0D5] bg-white p-6 space-y-2"
              >
                <h3 className="font-display font-bold text-base text-[#0F291E]">
                  {faq.q}
                </h3>
                <p className="text-sm text-[#4A5950] leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
