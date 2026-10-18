"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Boxes,
  Scale,
  BarChart3,
  BrainCircuit,
  QrCode,
  CalendarClock,
  Users,
  Award,
  UserCheck,
  FileSpreadsheet,
  Settings,
  CreditCard,
  Bell,
  ChefHat,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useAuth, useToast } from "@/providers/AppProviders";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";

const NAV_ITEMS = [
  { href: "/app/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/app/orders", label: "Orders & POS", icon: ClipboardList },
  { href: "/app/menu", label: "Menu & Modifiers", icon: UtensilsCrossed },
  { href: "/app/inventory", label: "Inventory & Waste", icon: Boxes },
  { href: "/app/recipes", label: "Recipe Costing", icon: Scale },
  { href: "/app/analytics", label: "Profitability Matrix", icon: BarChart3 },
  { href: "/app/ai-insights", label: "AI Copilot", icon: BrainCircuit },
  { href: "/app/tables", label: "Tables & QR Studio", icon: QrCode },
  { href: "/app/reservations", label: "Reservations", icon: CalendarClock },
  { href: "/app/customers", label: "Customers", icon: Users },
  { href: "/app/loyalty", label: "Loyalty Ledger", icon: Award },
  { href: "/app/staff", label: "Staff & RBAC", icon: UserCheck },
  { href: "/app/reports", label: "Reports & Exports", icon: FileSpreadsheet },
  { href: "/app/settings", label: "GST & Settings", icon: Settings },
  { href: "/app/billing", label: "Billing & Plan", icon: CreditCard },
];

export default function AppDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const { toast } = useToast();
  const {
    user,
    restaurant,
    workspaces,
    role,
    isLoading,
    switchWorkspace,
    logout,
  } = useAuth();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", restaurant?.id],
    queryFn: () => apiFetch("/restaurant/notifications"),
    enabled: Boolean(restaurant?.id),
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!restaurant?.id) return;
    const socket = getSocket();

    function joinRoom() {
      setSocketConnected(true);
      socket.emit("join:restaurant", {
        restaurantId: restaurant!.id,
        surface: "dashboard",
      });
    }

    if (socket.connected) {
      joinRoom();
    }
    socket.on("connect", joinRoom);
    socket.on("disconnect", () => setSocketConnected(false));

    const handleOrderEvent = (order: any) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      if (order?.orderNumber) {
        toast({
          title: `Live Order Update: ${order.orderNumber}`,
          description: `Status: ${order.status} • Table ${
            order.tableLabelSnapshot || order.orderType
          }`,
          variant: "success",
        });
      }
    };

    const handleNotificationEvent = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    socket.on("order:created", handleOrderEvent);
    socket.on("order:updated", handleOrderEvent);
    socket.on("order:kot_added", handleOrderEvent);
    socket.on("notification:new", handleNotificationEvent);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("order:created", handleOrderEvent);
      socket.off("order:updated", handleOrderEvent);
      socket.off("order:kot_added", handleOrderEvent);
      socket.off("notification:new", handleNotificationEvent);
    };
  }, [restaurant?.id, queryClient, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F3]">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#101820]">
          <div className="h-5 w-5 rounded-full border-2 border-[#176B52] border-t-transparent animate-spin" />
          Loading DinePilot Workspace...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  async function markNotificationRead(id: string) {
    await apiFetch(`/restaurant/notifications/${id}/read`, {
      method: "PATCH",
    });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="min-h-screen flex bg-[#F8F7F3] text-[#101820]">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#101820] text-[#F8F7F3] border-r border-white/10">
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <Link href="/app/overview" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[#176B52] flex items-center justify-center text-white shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-bold text-base text-white tracking-tight">
                DinePilot
              </span>
              <span className="block text-[10px] text-[#20A67A] font-mono uppercase">
                {restaurant?.city || "India"} • {role || "STAFF"}
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors z-10 ${
                  active
                    ? "text-white font-semibold"
                    : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="app-sidebar-active"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 rounded-xl bg-[#176B52] border border-[#20A67A]/30 shadow-sm -z-10"
                  />
                )}
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active ? "text-[#20A67A]" : "text-[#94A3B8]"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {user.isPlatformAdmin && (
            <div className="pt-3 mt-3 border-t border-white/10">
              <Link
                href="/platform/overview"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#C6A15B] hover:bg-white/5"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Platform Admin</span>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-2.5 bg-[#0B1117]/60">
          <div className="flex items-center gap-2">
            <Link
              href={`/menu/${restaurant?.slug || "saoji-spice-nagpur"}?table=tbl_saoji_t01`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#182430] hover:bg-[#223242] border border-white/10 px-2.5 py-2 text-[11px] font-semibold text-white transition-colors"
            >
              <QrCode className="h-3.5 w-3.5 text-[#20A67A]" />
              Guest QR
            </Link>
            <Link
              href="/kitchen"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#182430] hover:bg-[#223242] border border-white/10 px-2.5 py-2 text-[11px] font-semibold text-white transition-colors"
            >
              <ChefHat className="h-3.5 w-3.5 text-[#C6A15B]" />
              Live KDS
            </Link>
          </div>

          <div className="flex items-center justify-between px-2 pt-1 text-xs text-[#94A3B8]">
            <div className="truncate pr-2">
              <p className="font-semibold text-white truncate">{user.name}</p>
              <p className="text-[11px] truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden rounded-xl p-2 text-[#101820] hover:bg-[#F8F7F3] border border-[#E5E7EB]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {workspaces.length > 1 ? (
              <select
                value={restaurant?.id || ""}
                onChange={(e) => switchWorkspace(e.target.value)}
                className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F3] px-3 py-1.5 text-xs font-semibold text-[#101820]"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.role})
                  </option>
                ))}
              </select>
            ) : (
              <div className="truncate">
                <h1 className="font-display font-bold text-sm sm:text-base text-[#101820] truncate">
                  {restaurant?.name || "Restaurant Workspace"}
                </h1>
              </div>
            )}

            {restaurant?.isDemo && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#F9F4EA] border border-[#C6A15B]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#101820]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C6A15B]" />
                DEMO ENVIRONMENT
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 rounded-full bg-[#E8F3EF] border border-[#176B52]/20 px-3 py-1 text-[11px] font-semibold text-[#176B52]">
              <span
                className={`h-2 w-2 rounded-full ${
                  socketConnected ? "bg-[#20A67A]" : "bg-amber-500"
                }`}
              />
              <span>{socketConnected ? "Live Sync" : "Syncing"}</span>
            </div>

            <Link
              href={`/menu/${restaurant?.slug || "saoji-spice-nagpur"}?table=tbl_saoji_t01`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#101820] hover:bg-[#F8F7F3] transition-colors"
            >
              <QrCode className="h-3.5 w-3.5 text-[#176B52]" />
              Guest QR Menu
              <ExternalLink className="h-3 w-3 text-[#64748B]" />
            </Link>

            <Link
              href="/kitchen"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#101820] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#182430] transition-colors"
            >
              <ChefHat className="h-3.5 w-3.5 text-[#20A67A]" />
              Kitchen KDS
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-xl border border-[#E5E7EB] bg-white p-2 text-[#101820] hover:bg-[#F8F7F3] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-[#176B52] px-1 text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 6, scale: 0.98 }
                    }
                    animate={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 1, y: 0, scale: 1 }
                    }
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 6, scale: 0.98 }
                    }
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E5E7EB] bg-white shadow-elevated p-3 z-50 space-y-2"
                  >
                    <div className="flex items-center justify-between px-1 pb-2 border-b border-[#E5E7EB]">
                      <span className="text-xs font-bold text-[#101820]">
                        Operational Alerts ({unreadCount} unread)
                      </span>
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs text-[#64748B] hover:text-[#101820]"
                      >
                        Close
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-[#64748B] py-4 text-center">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.slice(0, 10).map((n: any) => (
                          <div
                            key={n._id}
                            onClick={() => markNotificationRead(n._id)}
                            className={`cursor-pointer rounded-xl p-2.5 text-xs border transition-colors ${
                              n.isRead
                                ? "border-transparent bg-[#F8F7F3] text-[#64748B]"
                                : "border-[#C6A15B]/40 bg-[#FCF9F3] text-[#101820]"
                            }`}
                          >
                            <p className="font-semibold">{n.title}</p>
                            <p className="mt-0.5 text-[11px]">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#101820]/60 backdrop-blur-xs"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <motion.aside
                initial={prefersReducedMotion ? { x: 0 } : { x: -260 }}
                animate={{ x: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { x: -260 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-64 max-w-xs bg-[#101820] text-[#F8F7F3] flex flex-col z-10"
              >
                <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
                  <span className="font-display font-bold text-base text-white">
                    DinePilot
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1.5 text-[#94A3B8] hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                          active
                            ? "bg-[#176B52] text-white"
                            : "text-[#94A3B8] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
