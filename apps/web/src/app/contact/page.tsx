"use client";

import React, { useState } from "react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { useToast } from "@/providers/AppProviders";

export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast({
      title: "Inquiry received",
      description: `Thank you, ${name}. Our Nagpur onboarding team will respond to ${email}.`,
      variant: "success",
    });
    setName("");
    setEmail("");
    setRestaurant("");
    setMessage("");
  }

  return (
    <MarketingLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div>
          <span className="rounded-full bg-[#E6ECE8] px-3 py-1 text-xs font-semibold text-[#0F291E]">
            Contact & Onboarding
          </span>
          <h1 className="font-display text-3xl font-bold text-[#0F291E] mt-3">
            Talk to the DinePilot engineering & operations team
          </h1>
          <p className="text-sm text-[#4A5950] mt-2">
            Headquartered in Nagpur, Maharashtra • Serving independent
            restaurants, cafés, and cloud kitchens across India.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E5E0D5] bg-white p-7 shadow-card space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#111C16] mb-1">
                Your Name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#E5E0D5] px-3.5 py-2.5 text-sm"
                placeholder="Aryan Deshmukh"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111C16] mb-1">
                Work Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#E5E0D5] px-3.5 py-2.5 text-sm"
                placeholder="owner@restaurant.in"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111C16] mb-1">
              Restaurant / Cloud Kitchen Name & City
            </label>
            <input
              required
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              className="w-full rounded-lg border border-[#E5E0D5] px-3.5 py-2.5 text-sm"
              placeholder="Saoji & Spice Kitchen, Dharampeth, Nagpur"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111C16] mb-1">
              How can we help?
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-[#E5E0D5] px-3.5 py-2.5 text-sm"
              placeholder="Tell us about your tables, kitchen stations, or recipe costing workflow..."
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#0F291E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#163829]"
          >
            Send Inquiry
          </button>
        </form>
      </div>
    </MarketingLayout>
  );
}
