"use client";

import React from "react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function AboutPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <span className="rounded-full bg-[#E6ECE8] px-3 py-1 text-xs font-semibold text-[#0F291E]">
          Our Product Philosophy
        </span>
        <h1 className="font-display text-4xl font-bold text-[#0F291E]">
          Why we built DinePilot for independent Indian restaurants
        </h1>
        <p className="text-base text-[#4A5950] leading-relaxed">
          Independent restaurants, cafés, and cloud kitchens in cities like
          Nagpur operate on tight margins where a 5% swing in ingredient yield
          or an unpriced portion change determines whether a busy weekend was
          actually profitable.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="rounded-xl border border-[#E5E0D5] bg-white p-6 space-y-2">
            <h2 className="font-display font-bold text-lg text-[#0F291E]">
              Integer Paise Financial Integrity
            </h2>
            <p className="text-sm text-[#4A5950] leading-relaxed">
              Every item price, modifier delta, packaging fee, CGST/SGST tax
              component, and rupee round-off is calculated on the backend in
              integer paise—never trusting client-submitted totals.
            </p>
          </div>
          <div className="rounded-xl border border-[#E5E0D5] bg-white p-6 space-y-2">
            <h2 className="font-display font-bold text-lg text-[#0F291E]">
              Explainable Operational Intelligence
            </h2>
            <p className="text-sm text-[#4A5950] leading-relaxed">
              Every recommendation in DinePilot cites its underlying recipe
              cost, sales volume, or stock movement record and clearly separates
              measured historical facts from replenishment forecasts.
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
