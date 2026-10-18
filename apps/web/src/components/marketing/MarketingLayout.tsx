"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  Menu,
  X,
  ArrowRight,
  QrCode,
  ChefHat,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/providers/AppProviders";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const navLinks = [
    { href: "/features", label: "Platform Architecture" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "Our Philosophy" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F3] text-[#101820]">
      <div className="bg-[#101820] text-[#F8F7F3]/90 text-xs py-2.5 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#20A67A]" />
            <span className="font-medium tracking-wide">
              Engineered for independent restaurants, cafés & cloud kitchens in
              India • Full GST & Multi-KOT support
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
              className="text-[#F8F7F3] hover:text-[#20A67A] transition-colors inline-flex items-center gap-1.5 font-medium"
            >
              <QrCode className="h-3.5 w-3.5 text-[#20A67A]" />
              Try Live Guest QR Menu
            </Link>
            <Link
              href="/order/ord_demo_preparing_1010"
              className="text-[#F8F7F3]/80 hover:text-white transition-colors hidden sm:inline-flex items-center gap-1.5 font-medium"
            >
              Live Order Tracker →
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-[#F8F7F3]/90 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-[#101820] border border-[#176B52]/40 flex items-center justify-center text-[#20A67A] shadow-card group-hover:bg-[#176B52] group-hover:text-white transition-colors">
              <Compass className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-tight text-[#101820]">
                DinePilot
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-white border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#176B52]">
                <Sparkles className="h-2.5 w-2.5 text-[#C6A15B]" />
                Operations OS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-white/80 border border-[#E5E7EB] rounded-xl p-1 shadow-card">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? "text-[#101820] font-semibold"
                      : "text-[#64748B] hover:text-[#101820]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="marketing-nav-pill"
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute inset-0 rounded-lg bg-[#E8F3EF] border border-[#176B52]/20 -z-10"
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href="/app/overview"
                className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2 text-sm font-semibold text-white hover:bg-[#125541] transition-colors shadow-card"
              >
                <LayoutDashboard className="h-4 w-4 text-[#F8F7F3]" />
                Open Workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2 text-sm font-semibold text-[#101820] hover:bg-white border border-transparent hover:border-[#E5E7EB] transition-all"
                >
                  Sign In / Demo
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2 text-sm font-semibold text-white hover:bg-[#125541] transition-colors shadow-card"
                >
                  Start Restaurant Workspace
                  <ArrowRight className="h-4 w-4 text-[#F8F7F3]" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden rounded-xl p-2 text-[#101820] hover:bg-white border border-transparent hover:border-[#E5E7EB]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
              }
              animate={
                prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
              }
              exit={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
              }
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="md:hidden border-t border-[#E5E7EB] bg-white px-4 py-4 space-y-2 shadow-editorial"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-[#101820] hover:bg-[#F8F7F3]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-[#E5E7EB] flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] py-2.5 text-sm font-semibold text-[#101820]"
                >
                  Sign In / Interactive Demo
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-[#176B52] py-2.5 text-sm font-semibold text-white"
                >
                  Create Restaurant Account
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#101820] text-[#F8F7F3] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#176B52] flex items-center justify-center text-white shadow-sm">
                  <Compass className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-lg text-white">
                  DinePilot
                </span>
                <span className="rounded border border-[#C6A15B]/40 bg-[#C6A15B]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#C6A15B]">
                  Enterprise Hospitality
                </span>
              </div>
              <p className="text-sm text-[#94A3B8] max-w-sm leading-relaxed">
                Restaurant profitability, ingredient yield costing, multi-KOT QR
                ordering, and AI-assisted operational intelligence built for
                independent food businesses across India.
              </p>
              <div className="text-xs text-[#64748B] font-mono">
                Default Currency: INR (₹) • Timezone: Asia/Kolkata (IST)
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C6A15B] mb-3.5">
                Platform
              </h3>
              <ul className="space-y-2.5 text-sm text-[#94A3B8]">
                <li>
                  <Link
                    href="/features"
                    className="hover:text-white transition-colors"
                  >
                    Menu Profitability Engine
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="hover:text-white transition-colors"
                  >
                    Inventory & Yield Costing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="hover:text-white transition-colors"
                  >
                    AI Business Copilot
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing & Plans
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C6A15B] mb-3.5">
                Live Experiences
              </h3>
              <ul className="space-y-2.5 text-sm text-[#94A3B8]">
                <li>
                  <Link
                    href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <QrCode className="h-3.5 w-3.5 text-[#20A67A]" />
                    Guest QR Menu (Table T-01)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/order/ord_demo_preparing_1010"
                    className="hover:text-white transition-colors"
                  >
                    Guest Live Order Tracker
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kitchen"
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <ChefHat className="h-3.5 w-3.5 text-[#20A67A]" />
                    Kitchen Display (KDS)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-white transition-colors"
                  >
                    Owner & Admin Console
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C6A15B] mb-3.5">
                Company & Legal
              </h3>
              <ul className="space-y-2.5 text-sm text-[#94A3B8]">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About DinePilot
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact & Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
            <p>© 2026 DinePilot Systems. Built for serious restaurant operators.</p>
            <p>
              Deterministic financial accounting • Multi-tenant isolation •
              India-first GST engine.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
