"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Store } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { apiFetch, setActiveRestaurantIdHeader } from "@/lib/api";
import { useAuth, useToast } from "@/providers/AppProviders";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const { toast } = useToast();

  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [city, setCity] = useState("Nagpur");
  const [state, setState] = useState("Maharashtra");
  const [gstin, setGstin] = useState("");
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      setActiveRestaurantIdHeader(null);
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ownerName,
          email,
          phone,
          password,
          restaurantName,
          city,
          state,
          gstin: gstin || undefined,
          fssaiNumber: fssaiNumber || undefined,
        }),
      });
      await refreshAuth();
      toast({
        title: "Restaurant workspace created",
        description: `${data.restaurant.name} is ready on DinePilot.`,
        variant: "success",
      });
      router.push("/app/overview");
    } catch (err: any) {
      setErrorMessage(err?.message || "Registration failed. Check your inputs.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MarketingLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-editorial space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#286249]">
              <Store className="h-4 w-4" />
              <span>Multi-Tenant Restaurant Onboarding</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#101820]">
              Create your restaurant workspace
            </h1>
            <p className="text-sm text-[#64748B]">
              Includes starter QR dine-in tables, INR paise accounting, and
              configurable Indian GST rules.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#101820] mb-1">
                  Owner Full Name *
                </label>
                <input
                  required
                  minLength={2}
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm"
                  placeholder="Aryan Deshmukh"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#101820] mb-1">
                  Work Email *
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm"
                  placeholder="founder@myrestaurant.in"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#101820] mb-1">
                  Phone Number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm"
                  placeholder="+91 98230 00000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#101820] mb-1">
                  Password (min 8 chars) *
                </label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB]">
              <label className="block text-xs font-semibold text-[#101820] mb-1">
                Restaurant / Café / Cloud Kitchen Name *
              </label>
              <input
                required
                minLength={2}
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm"
                placeholder="Dharampeth Spice & Grill"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#101820] mb-1">
                  City *
                </label>
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#101820] mb-1">
                  State *
                </label>
                <input
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#101820] mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm font-mono"
                  placeholder="27AABCS1429B1Z5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#101820] mb-1">
                  FSSAI License No. (Optional)
                </label>
                <input
                  value={fssaiNumber}
                  onChange={(e) => setFssaiNumber(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm font-mono"
                  placeholder="11524055000421"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#176B52] py-3.5 px-4 text-sm font-semibold text-white hover:bg-[#125541] disabled:opacity-60 transition-colors"
            >
              {submitting
                ? "Provisioning Workspace..."
                : "Create Restaurant & Enter Dashboard"}
              <ArrowRight className="h-4 w-4 text-[#20A67A]" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#E5E7EB] text-xs text-[#64748B] flex items-center justify-between">
            <span>Already have an account or want to explore the Demo?</span>
            <Link
              href="/login"
              className="font-semibold text-[#101820] hover:underline"
            >
              Sign In / Demo Launchers →
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
