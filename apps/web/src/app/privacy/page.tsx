"use client";

import React from "react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <h1 className="font-display text-3xl font-bold text-[#101820]">
          Privacy Policy & Data Protection
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Effective Date: October 18, 2026 • DinePilot Systems
        </p>
        <div className="space-y-4 text-sm text-[#64748B] leading-relaxed">
          <p>
            <strong>1. Multi-Tenant Data Isolation:</strong> Each restaurant
            workspace on DinePilot is logically isolated by tenant ownership.
            Your recipes, supplier pricing, orders, and customer records are
            never shared with other restaurants.
          </p>
          <p>
            <strong>2. Customer Consent & Privacy:</strong> Guest phone numbers
            and order history are never exposed through public URLs. Promotional
            messaging requires explicit opt-in (`marketingConsent = true`) and
            can be revoked at any time.
          </p>
          <p>
            <strong>3. Public Order Tracking:</strong> Public order tracking
            links use non-guessable 128-bit cryptographic tokens rather than
            database ObjectIds.
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
