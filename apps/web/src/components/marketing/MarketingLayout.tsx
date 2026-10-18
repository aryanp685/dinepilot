"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

  const navLinks = [
    { href: "/features", label: "Platform Architecture" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "Our Philosophy" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#111C16]">
      <div className="bg-[#0F291E] text-[#E6ECE8] text-xs py-2 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#84CC16]" />
            <span>
              Engineered for independent restaurants, cafés & cloud kitchens in
              India • Full GST & Multi-KOT support
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
              className="underline decoration-[#84CC16]/60 hover:text-white inline-flex items-center gap-1 font-medium"
            >
              <QrCode className="h-3.5 w-3.5 text-[#84CC16]" />
              Try Live Guest QR Menu
            </Link>
            <Link
              href="/order/ord_demo_preparing_1010"
              className="underline decoration-[#84CC16]/60 hover:text-white hidden sm:inline-flex items-center gap-1 font-medium"
            >
              Live Order Tracker
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E5E0D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-[#0F291E] flex items-center justify-center text-[#84CC16] shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-[#0F291E]">
                DinePilot
              </span>
              <span className="hidden sm:inline-block ml-2 rounded bg-[#E6ECE8] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0F291E]">
                Operations OS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    active
                      ? "text-[#0F291E] font-semibold"
                      : "text-[#4A5950] hover:text-[#0F291E]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href="/app/overview"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F291E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163829] transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-[#84CC16]" />
                Open Workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3.5 py-2 text-sm font-semibold text-[#0F291E] hover:bg-[#E6ECE8]/60 transition-colors"
                >
                  Sign In / Demo
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F291E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163829] transition-colors shadow-sm"
                >
                  Start Restaurant Workspace
                  <ArrowRight className="h-4 w-4 text-[#84CC16]" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden rounded-lg p-2 text-[#0F291E] hover:bg-[#E6ECE8]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E0D5] bg-[#FBF9F5] px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-[#111C16]"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[#E5E0D5] flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-lg border border-[#0F291E] py-2.5 text-sm font-semibold text-[#0F291E]"
              >
                Sign In / Interactive Demo
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-lg bg-[#0F291E] py-2.5 text-sm font-semibold text-white"
              >
                Create Restaurant Account
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#0F291E] text-[#E6ECE8] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#84CC16] flex items-center justify-center text-[#0F291E]">
                  <Compass className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-lg text-white">
                  DinePilot
                </span>
              </div>
              <p className="text-sm text-[#E6ECE8]/80 max-w-sm leading-relaxed">
                Restaurant profitability, ingredient yield costing, multi-KOT QR
                ordering, and AI-assisted operational intelligence built for
                independent food businesses across India.
              </p>
              <div className="text-xs text-[#E6ECE8]/60">
                Default Currency: INR (₹) • Timezone: Asia/Kolkata (IST)
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#84CC16] mb-3">
                Platform
              </h3>
              <ul className="space-y-2.5 text-sm text-[#E6ECE8]/80">
                <li>
                  <Link href="/features" className="hover:text-white">
                    Menu Profitability Engine
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="hover:text-white">
                    Inventory & Yield Costing
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="hover:text-white">
                    AI Business Copilot
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Pricing & Plans
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#84CC16] mb-3">
                Live Experiences
              </h3>
              <ul className="space-y-2.5 text-sm text-[#E6ECE8]/80">
                <li>
                  <Link
                    href="/menu/saoji-spice-nagpur?table=tbl_saoji_t01"
                    className="hover:text-white inline-flex items-center gap-1.5"
                  >
                    <QrCode className="h-3.5 w-3.5 text-[#84CC16]" />
                    Guest QR Menu (Table T-01)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/order/ord_demo_preparing_1010"
                    className="hover:text-white"
                  >
                    Guest Live Order Tracker
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kitchen"
                    className="hover:text-white inline-flex items-center gap-1.5"
                  >
                    <ChefHat className="h-3.5 w-3.5 text-[#84CC16]" />
                    Kitchen Display (KDS)
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white">
                    Owner & Admin Console
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#84CC16] mb-3">
                Company & Legal
              </h3>
              <ul className="space-y-2.5 text-sm text-[#E6ECE8]/80">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About DinePilot
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact & Support
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#E6ECE8]/60 gap-4">
            <p>© 2026 DinePilot Systems. Built for serious restaurant operators.</p>
            <p>
              No fabricated customer counts or artificial claims • Transparent
              engineering.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
