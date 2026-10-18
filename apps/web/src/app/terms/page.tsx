"use client";

import React from "react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <h1 className="font-display text-3xl font-bold text-[#0F291E]">
          Terms of Service
        </h1>
        <p className="text-sm text-[#4A5950] leading-relaxed">
          Effective Date: October 18, 2026 • Jurisdiction: Nagpur, Maharashtra,
          India
        </p>
        <div className="space-y-4 text-sm text-[#4A5950] leading-relaxed">
          <p>
            <strong>1. Service Scope:</strong> DinePilot provides restaurant
            operations, QR menu ordering, inventory ledger management, recipe
            costing, and business intelligence software.
          </p>
          <p>
            <strong>2. Tax & Financial Responsibility:</strong> Restaurants
            configure their applicable GST mode (Regular 5%, Tax-Inclusive, or
            Composition Scheme) and GSTIN/FSSAI details in `/app/settings` and
            remain responsible for statutory tax filings.
          </p>
          <p>
            <strong>3. Payment Verification:</strong> A QR code or guest payment
            screenshot is not proof of settlement. Restaurants must verify UPI,
            cash, or card settlements before marking orders as PAID.
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
