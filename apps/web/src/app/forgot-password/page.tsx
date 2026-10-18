"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 450));
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <MarketingLayout>
      <section className="py-16 lg:py-24 px-4">
        <div className="max-w-md mx-auto rounded-2xl border border-[#E5E7EB] bg-white p-7 sm:p-8 shadow-editorial space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8F3EF] px-2.5 py-1 text-[11px] font-semibold text-[#176B52]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Account Recovery
            </span>
            <h1 className="font-display text-2xl font-bold text-[#121715]">
              Reset your workspace password
            </h1>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Enter the email address associated with your DinePilot restaurant
              account. For immediate testing, you can also use our 1-click demo
              logins on the Sign In page.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-xl border border-[#20A67A]/30 bg-[#E6F7F1] p-5 space-y-3 text-xs text-[#121715]">
              <div className="flex items-center gap-2 font-bold text-[#176B52] text-sm">
                <CheckCircle2 className="h-5 w-5 text-[#20A67A]" />
                Recovery instructions queued
              </div>
              <p className="text-[#475569] leading-relaxed">
                If an active workspace user matches{" "}
                <strong className="font-mono text-[#121715]">{email}</strong>,
                password reset instructions have been logged. In this sandbox
                environment, all demo accounts use{" "}
                <code className="font-mono font-bold">DinePilot@2026</code>.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125541]"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-semibold text-[#121715] mb-1.5"
                >
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@dinepilot.in"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] pl-10 pr-3.5 py-2.5 text-xs text-[#121715] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#176B52] py-3 text-xs font-bold text-white hover:bg-[#125541] transition-colors disabled:opacity-50"
              >
                {submitting
                  ? "Verifying Account..."
                  : "Send Recovery Instructions"}
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-[#176B52] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
            <Link
              href="/register"
              className="text-[#64748B] hover:text-[#121715]"
            >
              Create new restaurant →
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
