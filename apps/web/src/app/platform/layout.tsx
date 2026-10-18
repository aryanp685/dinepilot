"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  FileSearch,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/providers/AppProviders";

const PLATFORM_NAV = [
  { href: "/platform/overview", label: "Platform Overview", icon: LayoutDashboard },
  { href: "/platform/restaurants", label: "Tenant Restaurants", icon: Store },
  { href: "/platform/users", label: "Platform Users", icon: Users },
  { href: "/platform/subscriptions", label: "Subscriptions & MRR", icon: CreditCard },
  { href: "/platform/audit-logs", label: "Security Audit Logs", icon: FileSearch },
];

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-6">
        <p className="text-xs font-medium text-[#4A5950]">
          Verifying Platform Administrator privileges...
        </p>
      </div>
    );
  }

  if (user && !user.isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center space-y-4 shadow-editorial">
          <ShieldAlert className="h-10 w-10 text-red-600 mx-auto" />
          <h1 className="font-display text-xl font-bold text-[#0F291E]">
            Platform Admin Access Restricted
          </h1>
          <p className="text-xs text-[#4A5950] leading-relaxed">
            Your current account (<code>{user.email}</code>) is a tenant user
            and does not have <code>isPlatformAdmin</code> privileges. Sign in
            with <code>admin@dinepilot.in</code> to access `/platform/*`.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/app/overview"
              className="rounded-xl border border-[#E5E0D5] px-4 py-2 text-xs font-semibold text-[#0F291E]"
            >
              Return to Restaurant App
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-[#0F291E] px-4 py-2 text-xs font-semibold text-white"
            >
              Switch to Platform Admin Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#FBF9F5] text-[#111C16]">
      <aside className="w-64 shrink-0 bg-[#0F291E] text-white flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-[#1E4635]">
            <span className="rounded bg-[#84CC16] px-2 py-0.5 text-[10px] font-bold text-[#0F291E]">
              SUPERADMIN CONTROL PLANE
            </span>
            <h1 className="font-display font-bold text-lg mt-1.5">
              DinePilot Platform
            </h1>
            <p className="text-[11px] text-[#E6ECE8]/75">
              Multi-Tenant SaaS Governance
            </p>
          </div>

          <nav className="p-3 space-y-1">
            {PLATFORM_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#84CC16] text-[#0F291E] font-bold"
                      : "text-[#E6ECE8]/85 hover:bg-[#163829]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#1E4635] space-y-2">
          <Link
            href="/app/overview"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#234F3C] bg-[#163829] px-3 py-2 text-xs font-semibold text-[#E6ECE8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Restaurant Dashboard
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-950/60 border border-red-800/60 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-900/60"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out ({user?.email})
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
