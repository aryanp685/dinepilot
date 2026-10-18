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
} from "lucide-react";
import { useAuth } from "@/providers/AppProviders";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const navLinks = [
    { href: "/features", label: "Features" },
    { href: "/#qr-ordering", label: "QR Ordering" },
    { href: "/#kitchen-workflow", label: "Kitchen & Ops" },
    { href: "/#analytics-intelligence", label: "Analytics & Costing" },
    { href: "/pricing", label: "Pricing" },
    { href: "/#faq", label: "FAQ" },
    { href: "/contact", label: "Book Demo" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F3] text-[#121715]">
      <div className="bg-[#121715] text-[#F8F7F3]/90 text-xs py-2.5 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#20A67A]" />
            <span className="font-medium">
              Complete QR Table Ordering, Kitchen Display & Restaurant
              Operations Platform — No App Install Required
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
              className="text-[#F8F7F3] hover:text-[#20A67A] transition-colors inline-flex items-center gap-1.5 font-medium"
            >
              <QrCode className="h-3.5 w-3.5 text-[#20A67A]" />
              Live Guest QR Menu
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

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="h-9 w-9 rounded-xl bg-[#176B52] flex items-center justify-center text-white shadow-card group-hover:bg-[#125541] transition-colors">
              <Compass className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-tight text-[#121715]">
                DinePilot
              </span>
              <span className="hidden xl:inline-flex items-center rounded-md bg-[#E8F3EF] border border-[#176B52]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#176B52]">
                Restaurant OS
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    active
                      ? "text-[#176B52] bg-[#E8F3EF]"
                      : "text-[#64748B] hover:text-[#121715] hover:bg-[#F8F7F3]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {user ? (
              <Link
                href="/app/overview"
                className="inline-flex items-center gap-2 rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white hover:bg-[#125541] transition-colors shadow-card"
              >
                <LayoutDashboard className="h-4 w-4" />
                Open Workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-[#121715] hover:bg-[#F8F7F3] border border-[#E5E7EB] transition-all"
                >
                  Sign In / Demo
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-4 py-2 text-xs font-semibold text-white hover:bg-[#125541] transition-colors shadow-card"
                >
                  Start Workspace
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden rounded-xl p-2 text-[#121715] hover:bg-[#F8F7F3] border border-[#E5E7EB]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
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
              className="lg:hidden border-t border-[#E5E7EB] bg-white px-4 py-4 space-y-1.5 shadow-editorial"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-[#121715] hover:bg-[#F8F7F3]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-[#E5E7EB] flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] py-2.5 text-sm font-semibold text-[#121715]"
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

      <footer className="bg-[#121715] text-[#F8F7F3] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#176B52] flex items-center justify-center text-white">
                  <Compass className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-lg text-white">
                  DinePilot
                </span>
              </div>
              <p className="text-sm text-[#94A3B8] max-w-sm leading-relaxed">
                Modern QR table ordering, digital menus, real-time kitchen
                display workflows, and recipe profitability intelligence for
                restaurants and cafés.
              </p>
              <div className="text-xs text-[#64748B] font-mono">
                Currency: INR (₹) • Timezone: Asia/Kolkata (IST)
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#20A67A] mb-3.5">
                Product Modules
              </h3>
              <ul className="space-y-2.5 text-sm text-[#94A3B8]">
                <li>
                  <Link
                    href="/#qr-ordering"
                    className="hover:text-white transition-colors"
                  >
                    QR Table Ordering
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#digital-menu"
                    className="hover:text-white transition-colors"
                  >
                    Digital Menu & Modifiers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#kitchen-workflow"
                    className="hover:text-white transition-colors"
                  >
                    Live Order Desk & KDS
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#analytics-intelligence"
                    className="hover:text-white transition-colors"
                  >
                    Analytics & Recipe Costing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#20A67A] mb-3.5">
                Interactive Previews
              </h3>
              <ul className="space-y-2.5 text-sm text-[#94A3B8]">
                <li>
                  <Link
                    href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <QrCode className="h-3.5 w-3.5 text-[#20A67A]" />
                    Customer QR Menu
                  </Link>
                </li>
                <li>
                  <Link
                    href="/order/ord_demo_preparing_1010"
                    className="hover:text-white transition-colors"
                  >
                    Live Order Status Tracker
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kitchen"
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <ChefHat className="h-3.5 w-3.5 text-[#20A67A]" />
                    Kitchen Display System
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-white transition-colors"
                  >
                    Owner Workspace Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#20A67A] mb-3.5">
                Company & Account
              </h3>
              <ul className="space-y-2.5 text-sm text-[#94A3B8]">
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing & Plans
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Book a Demo / Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/forgot-password"
                    className="hover:text-white transition-colors"
                  >
                    Password Recovery
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy & Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
            <p>© 2026 DinePilot Systems. Built for modern hospitality teams.</p>
            <p>
              Browser-based QR ordering • Staff POS fallback • Real-time KDS
              sync.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
