"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import {
  apiFetch,
  setActiveRestaurantIdHeader,
} from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isPlatformAdmin: boolean;
}

export interface AuthRestaurant {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  fssaiNumber?: string;
  upiVpa?: string;
  currency: string;
  timezone: string;
  qrThemePreset: "botanical" | "midnight" | "terracotta" | "nordic";
  isDemo: boolean;
  settings: {
    taxMode: "TAX_EXCLUSIVE" | "TAX_INCLUSIVE" | "COMPOSITION_OR_EXEMPT";
    cgstRateBps: number;
    sgstRateBps: number;
    serviceChargeRateBps: number;
    defaultPackagingPaise: number;
    enableRoundOff: boolean;
    allowDeliveryOrders: boolean;
    allowRunningTableKots: boolean;
    requirePinForQrOrders: boolean;
    operatingHoursOpen: string;
    operatingHoursClose: string;
    reservationSlotMinutes: number;
    loyaltyPointsPerHundredRupees: number;
  };
}

export interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
  city: string;
  isDemo: boolean;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  restaurant: AuthRestaurant | null;
  workspaces: WorkspaceOption[];
  role: string | null;
  permissions: string[];
  subscription: any | null;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  switchWorkspace: (restaurantId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  restaurant: null,
  workspaces: [],
  role: null,
  permissions: [],
  subscription: null,
  isLoading: true,
  refreshAuth: async () => {},
  switchWorkspace: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "error" | "warning";
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [user, setUser] = useState<AuthUser | null>(null);
  const [restaurant, setRestaurant] = useState<AuthRestaurant | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...item, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await apiFetch("/auth/me");
      setUser(data.user);
      setRestaurant(data.restaurant);
      setWorkspaces(data.workspaces || []);
      setRole(data.role);
      setPermissions(data.permissions || []);
      setSubscription(data.subscription || null);
    } catch {
      setUser(null);
      setRestaurant(null);
      setWorkspaces([]);
      setRole(null);
      setPermissions([]);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const switchWorkspace = useCallback(
    async (restaurantId: string) => {
      setActiveRestaurantIdHeader(restaurantId);
      await refreshAuth();
      queryClient.invalidateQueries();
      toast({
        title: "Workspace switched",
        description: "Updated active restaurant context",
        variant: "success",
      });
    },
    [refreshAuth, queryClient, toast]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
    }
    setActiveRestaurantIdHeader(null);
    setUser(null);
    setRestaurant(null);
    setRole(null);
    setPermissions([]);
    queryClient.clear();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastContext.Provider value={{ toast }}>
        <AuthContext.Provider
          value={{
            user,
            restaurant,
            workspaces,
            role,
            permissions,
            subscription,
            isLoading,
            refreshAuth,
            switchWorkspace,
            logout,
          }}
        >
          {children}
          <div
            aria-live="polite"
            className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
          >
            <AnimatePresence initial={false}>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 14, scale: 0.98 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 8, scale: 0.98 }
                  }
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-elevated"
                >
                  {t.variant === "error" ? (
                    <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  ) : t.variant === "warning" ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-[#20A67A] shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#101820]">
                      {t.title}
                    </p>
                    {t.description && (
                      <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setToasts((prev) =>
                        prev.filter((item) => item.id !== t.id)
                      )
                    }
                    className="text-[#64748B] hover:text-[#101820] rounded p-0.5"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </AuthContext.Provider>
      </ToastContext.Provider>
    </QueryClientProvider>
  );
}
