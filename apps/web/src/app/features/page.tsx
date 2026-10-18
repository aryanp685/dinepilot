"use client";

import React from "react";
import Link from "next/link";
import {
  Scale,
  BrainCircuit,
  QrCode,
  ChefHat,
  BarChart3,
  Award,
  ShieldCheck,
  ArrowRight,
  ReceiptIndianRupee,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function FeaturesPage() {
  const modules = [
    {
      icon: BarChart3,
      tag: "Menu Profitability Engine",
      title: "Four-Quadrant Menu Engineering Matrix",
      points: [
        "Classifies dishes into Stars (High Volume/High Margin), Plowhorses (High Volume/Low Margin), Puzzles (Low Volume/High Margin), and Dogs (Low Volume/Low Margin).",
        "Transparently flags menu items without configured recipes so profit figures are never fabricated.",
        "Allocates order-level discounts proportionally across line items and deducts packaging cost on takeaway/delivery orders.",
      ],
    },
    {
      icon: Scale,
      tag: "Inventory & Yield Intelligence",
      title: "Usable Yield Costing & Auditable Movement Ledger",
      points: [
        "Supports grams, kilograms, millilitres, litres, and countable units with strict cross-family unit validation.",
        "Factors usable yield percentage (e.g. 85% usable onion after peeling) into effective recipe serving cost.",
        "Every stock change writes an immutable ledger record: PURCHASE_RECEIVED, RECIPE_CONSUMPTION, WASTE, SPOILAGE, MANUAL_ADJUSTMENT, STOCK_CORRECTION, or RETURN_REVERSAL.",
      ],
    },
    {
      icon: BrainCircuit,
      tag: "AI Business Copilot",
      title: "Grounded Operational & Replenishment Intelligence",
      points: [
        "Calculates trusted historical metrics on the backend before generating insights or answering natural-language questions.",
        "Distinguishes measured historical facts from 7-day ingredient replenishment forecasts.",
        "Includes a built-in Deterministic Rule-Based Insights Engine with schema-validated output.",
      ],
    },
    {
      icon: QrCode,
      tag: "Guest QR Ordering",
      title: "Signed Table Tokens, 4 Theme Presets & Running Table KOTs",
      points: [
        "Four instant visual presets (Botanical Bistro, Midnight Izakaya, Terracotta Spice, Minimalist Nordic) powered by CSS tokens.",
        "Supports Running Table Sessions so dine-in guests can order repeat rounds (KOT #1, KOT #2) onto a single consolidated GST bill.",
        "Recalculates all item prices, modifiers, taxes, and rupee round-off on the server.",
      ],
    },
    {
      icon: ChefHat,
      tag: "Kitchen & Floor Operations",
      title: "Documented Order State Machine & Live Socket.IO KDS",
      points: [
        "Enforces NEW → ACCEPTED → PREPARING → READY → COMPLETED transitions on the server and logs every actor and timestamp.",
        "Broadcasts live updates to restaurant-scoped rooms (/kitchen, /app/orders, and guest tracker /order/:publicOrderToken).",
      ],
    },
    {
      icon: Award,
      tag: "Loyalty, Staff & Reservations",
      title: "Auditable Points Ledger, RBAC Matrix & Conflict-Safe Bookings",
      points: [
        "Immutable loyalty points ledger (EARN, REDEEM, REVERSAL, BONUS) with explicit marketing consent tracking.",
        "Six distinct roles (Owner, Manager, Cashier, Kitchen, Waiter, Platform Admin) enforced on the backend.",
        "Concurrency-safe reservation slot allocation respecting restaurant operating hours and seating capacity.",
      ],
    },
  ];

  return (
    <MarketingLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-14">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E6ECE8] px-3 py-1 text-xs font-semibold text-[#0F291E]">
            Platform Architecture
          </span>
          <h1 className="font-display text-4xl font-bold text-[#0F291E]">
            Engineered from the database up for restaurant unit economics
          </h1>
          <p className="text-base text-[#4A5950] leading-relaxed">
            Explore how every module in DinePilot connects guest ordering to
            kitchen execution, inventory control, and financial clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="rounded-2xl border border-[#E5E0D5] bg-white p-7 shadow-card space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-[#E6ECE8] px-2.5 py-1 text-xs font-semibold text-[#0F291E]">
                    {m.tag}
                  </span>
                  <Icon className="h-5 w-5 text-[#D97706]" />
                </div>
                <h2 className="font-display text-xl font-bold text-[#0F291E]">
                  {m.title}
                </h2>
                <ul className="space-y-2.5 text-sm text-[#4A5950]">
                  {m.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#0F291E] shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-[#0F291E] text-white p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="font-display text-2xl font-bold">
              Test every module live in the Nagpur Demo Workspace
            </h3>
            <p className="text-sm text-[#E6ECE8]/80">
              Inspect real recipes, run the AI Copilot, place a QR table order,
              and watch it appear on the Kitchen Display System.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#84CC16] px-6 py-3.5 text-sm font-bold text-[#0F291E] hover:bg-[#9BE028] transition-colors shrink-0"
          >
            Open Demo Console
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
