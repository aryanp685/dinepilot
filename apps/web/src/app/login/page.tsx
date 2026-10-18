"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  ArrowRight,
  ChefHat,
  ShieldAlert,
  Store,
  Lock,
  Mail,
} from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { apiFetch, setActiveRestaurantIdHeader } from "@/lib/api";
import { useAuth, useToast } from "@/providers/AppProviders";

export default function LoginPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("owner@dinepilot.in");
  const [password, setPassword] = useState("DinePilot@2026");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  async function performLogin(
    targetEmail: string,
    targetPassword: string,
    redirectTo?: string
  ) {
    setSubmitting(true);
    setErrorMessage("");
    try {
      setActiveRestaurantIdHeader(null);
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: targetEmail,
          password: targetPassword,
        }),
      });
      await refreshAuth();
      toast({
        title: `Welcome back, ${data.user.name}`,
        description: data.restaurant
          ? `Connected to ${data.restaurant.name}`
          : "Connected to Platform Console",
        variant: "success",
      });

      if (redirectTo) {
        router.push(redirectTo);
      } else if (data.user.isPlatformAdmin && !data.restaurant) {
        router.push("/platform/overview");
      } else if (data.role === "KITCHEN") {
        router.push("/kitchen");
      } else {
        router.push("/app/overview");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await performLogin(email, password);
  }

  async function handleForgotPassword() {
    if (!email) {
      setErrorMessage("Enter your email first to request a password reset.");
      return;
    }
    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResetMessage(
        res.resetTokenPreview
          ? `Reset token generated (Dev preview: ${res.resetTokenPreview.slice(
              0,
              12
            )}...)`
          : res.message
      );
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not process request");
    }
  }

  return (
    <MarketingLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-editorial space-y-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#286249]">
                <Compass className="h-4 w-4" />
                <span>DinePilot Workspace Authentication</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-[#101820]">
                Sign in to your restaurant workspace
              </h1>
              <p className="text-sm text-[#64748B]">
                Access operations, menu profitability, recipe costing, and live
                kitchen workflows.
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

            {resetMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
                {resetMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101820] mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-[#64748B] absolute left-3.5 top-3" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] pl-10 pr-4 py-2.5 text-sm focus:border-[#176B52]"
                    placeholder="owner@dinepilot.in"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#101820]">
                    Password
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-medium text-[#176B52] hover:underline"
                    >
                      Quick reset token
                    </button>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-[#64748B] hover:text-[#121715] hover:underline"
                    >
                      Recovery page →
                    </Link>
                  </div>
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 text-[#64748B] absolute left-3.5 top-3" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] pl-10 pr-4 py-2.5 text-sm focus:border-[#176B52]"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#176B52] py-3 px-4 text-sm font-semibold text-white hover:bg-[#125541] disabled:opacity-60 transition-colors"
              >
                {submitting ? "Authenticating..." : "Sign In to DinePilot"}
                <ArrowRight className="h-4 w-4 text-[#20A67A]" />
              </button>
            </form>

            <div className="pt-4 border-t border-[#E5E7EB] text-xs text-[#64748B] flex items-center justify-between">
              <span>Setting up a new restaurant, café, or cloud kitchen?</span>
              <Link
                href="/register"
                className="font-semibold text-[#101820] hover:underline"
              >
                Create Restaurant Account →
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-[#121715] bg-[#121715] text-white p-7 space-y-5 shadow-editorial">
            <div className="space-y-1">
              <span className="inline-block rounded bg-[#20A67A] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#121715]">
                Interactive Demo Sandbox
              </span>
              <h2 className="font-display text-xl font-bold pt-1">
                One-Click Role Launchers
              </h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Explore pre-seeded Nagpur restaurant data (*Saoji & Spice
                Kitchen, Dharampeth*) across Owner, Kitchen KDS, and Platform
                Admin roles.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  performLogin(
                    "owner@dinepilot.in",
                    "DinePilot@2026",
                    "/app/overview"
                  )
                }
                className="w-full text-left rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 p-4 transition-colors flex items-start gap-3.5"
              >
                <div className="h-9 w-9 rounded-lg bg-[#20A67A] text-[#101820] flex items-center justify-center shrink-0 mt-0.5">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Restaurant Owner Console
                  </p>
                  <p className="text-xs text-[#E6ECE8]/75 mt-0.5">
                    Saoji & Spice Kitchen (Nagpur) • Full Profitability, AI
                    Copilot, Recipes & Orders
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  performLogin(
                    "chef@dinepilot.in",
                    "DinePilot@2026",
                    "/kitchen"
                  )
                }
                className="w-full text-left rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 p-4 transition-colors flex items-start gap-3.5"
              >
                <div className="h-9 w-9 rounded-lg bg-[#D97706] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ChefHat className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Kitchen Display System (/kitchen)
                  </p>
                  <p className="text-xs text-[#E6ECE8]/75 mt-0.5">
                    Ustad Ramesh Bawankule • Live KDS Ticket Queue & Prep
                    Workflow
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  performLogin(
                    "admin@dinepilot.in",
                    "DinePilot@2026",
                    "/platform/overview"
                  )
                }
                className="w-full text-left rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 p-4 transition-colors flex items-start gap-3.5"
              >
                <div className="h-9 w-9 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Platform Admin (/platform/overview)
                  </p>
                  <p className="text-xs text-[#E6ECE8]/75 mt-0.5">
                    SaaS Tenant Directory, Subscriptions, Users & Global Audit
                    Logs
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
