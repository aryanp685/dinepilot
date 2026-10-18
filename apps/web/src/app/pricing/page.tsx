"use client";

import React from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "₹999",
      desc: "Essential QR ordering, POS order desk, and Indian GST billing.",
      features: [
        "Up to 15 QR Dine-in Tables",
        "Order State Machine & Kitchen Display (KDS)",
        "GST Exclusive, Inclusive & Composition Modes",
        "Ingredient Stock & Purchase Ledger",
        "CSV Sales & Inventory Exports",
      ],
      highlight: false,
    },
    {
      name: "Growth",
      price: "₹2,499",
      desc: "Complete profitability, yield recipe costing, loyalty, and AI Copilot.",
      features: [
        "Up to 50 QR Dine-in Tables + Running Table KOTs",
        "Yield-Adjusted Recipe Costing Engine",
        "4-Quadrant Menu Profitability Matrix",
        "AI Business Copilot & 7-Day Replenishment Forecast",
        "Auditable Loyalty Points Ledger & Rewards",
        "Conflict-Safe Table Reservations",
      ],
      highlight: true,
    },
    {
      name: "Scale",
      price: "₹4,999",
      desc: "Built for multi-zone dining rooms and multi-outlet restaurant groups.",
      features: [
        "Up to 200 QR Dine-in Tables",
        "Multi-Workspace Owner Switcher",
        "Full Role Permission Matrix & Audit Logs",
        "HMAC Webhook & Payment Verification Suite",
        "Dedicated Menu Engineering Review",
      ],
      highlight: false,
    },
  ];

  return (
    <MarketingLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="max-w-2xl space-y-3">
          <span className="rounded-full bg-[#E8F3EF] px-3 py-1 text-xs font-semibold text-[#101820]">
            Simple INR Pricing
          </span>
          <h1 className="font-display text-4xl font-bold text-[#101820]">
            Predictable monthly SaaS pricing. Zero commission on your tables.
          </h1>
          <p className="text-base text-[#64748B]">
            All plans support Indian number formatting, configurable CGST/SGST
            splits, and rupee round-off out of the box.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-8 flex flex-col justify-between ${
                p.highlight
                  ? "border-[#176B52] bg-[#176B52] text-white shadow-editorial"
                  : "border-[#E5E7EB] bg-white text-[#101820]"
              }`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold">{p.name}</h2>
                  {p.highlight && (
                    <span className="rounded-full bg-[#20A67A] px-3 py-0.5 text-xs font-bold text-[#101820]">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-bold">{p.price}</span>
                  <span
                    className={`text-xs ${
                      p.highlight ? "text-[#E6ECE8]/75" : "text-[#64748B]"
                    }`}
                  >
                    / month + 18% GST
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    p.highlight ? "text-[#E6ECE8]/85" : "text-[#64748B]"
                  }`}
                >
                  {p.desc}
                </p>
                <ul className="space-y-3 pt-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          p.highlight ? "text-[#20A67A]" : "text-[#101820]"
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
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold ${
                    p.highlight
                      ? "bg-[#20A67A] text-[#101820] hover:bg-[#198763]"
                      : "bg-[#176B52] text-white hover:bg-[#125541]"
                  }`}
                >
                  Create {p.name} Workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MarketingLayout>
  );
}
