"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ChefHat,
  Utensils,
  QrCode,
  Smartphone,
  ClipboardCheck,
  BellRing,
  Sparkles,
  X,
} from "lucide-react";

export function PageHeader({
  badge,
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  badge?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pillLabel = eyebrow || badge;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E7EB]">
      <div className="space-y-1">
        {pillLabel && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8F3EF] border border-[#176B52]/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#176B52]">
            {pillLabel}
          </span>
        )}
        <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#121715]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export type StatusPillTone =
  | "forest"
  | "emerald"
  | "amber"
  | "crimson"
  | "blue"
  | "purple"
  | "neutral";

export function StatusPill({
  status,
  tone = "neutral",
  pulse = false,
  children,
}: {
  status?: string;
  tone?: StatusPillTone | string;
  pulse?: boolean;
  children?: React.ReactNode;
}) {
  if (children) {
    const toneStyles: Record<string, string> = {
      forest: "bg-[#E8F3EF] text-[#176B52] border-[#176B52]/20",
      emerald: "bg-[#E6F7F1] text-[#176B52] border-[#20A67A]/35",
      amber: "bg-amber-50 text-amber-900 border-amber-200",
      crimson: "bg-red-50 text-red-900 border-red-200",
      blue: "bg-blue-50 text-blue-900 border-blue-200",
      purple: "bg-purple-50 text-purple-900 border-purple-200",
      neutral: "bg-[#F8F7F3] text-[#475569] border-[#E5E7EB]",
    };

    const selectedStyle = toneStyles[tone] || toneStyles.neutral;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${selectedStyle}`}
      >
        {pulse && (
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
        )}
        {children}
      </span>
    );
  }

  const normalized = (status || "").toUpperCase();

  const map: Record<
    string,
    { bg: string; text: string; border: string; icon: any; label: string }
  > = {
    NEW: {
      bg: "bg-amber-50",
      text: "text-amber-900",
      border: "border-amber-200",
      icon: BellRing,
      label: "NEW ORDER",
    },
    ACCEPTED: {
      bg: "bg-blue-50",
      text: "text-blue-900",
      border: "border-blue-200",
      icon: ClipboardCheck,
      label: "ACCEPTED",
    },
    PREPARING: {
      bg: "bg-amber-100/80",
      text: "text-amber-950",
      border: "border-amber-300",
      icon: ChefHat,
      label: "IN KITCHEN",
    },
    READY: {
      bg: "bg-[#E6F7F1]",
      text: "text-[#176B52]",
      border: "border-[#20A67A]/40",
      icon: Utensils,
      label: "READY TO SERVE",
    },
    SERVED: {
      bg: "bg-[#E8F3EF]",
      text: "text-[#176B52]",
      border: "border-[#176B52]/30",
      icon: CheckCircle2,
      label: "SERVED",
    },
    COMPLETED: {
      bg: "bg-[#E6F7F1]",
      text: "text-[#176B52]",
      border: "border-[#20A67A]/40",
      icon: CheckCircle2,
      label: "COMPLETED",
    },
    CANCELLED: {
      bg: "bg-red-50",
      text: "text-red-900",
      border: "border-red-200",
      icon: XCircle,
      label: "CANCELLED",
    },
    PAID: {
      bg: "bg-[#E6F7F1]",
      text: "text-[#176B52]",
      border: "border-[#20A67A]/40",
      icon: CheckCircle2,
      label: "PAID",
    },
    PENDING_VERIFICATION: {
      bg: "bg-amber-50",
      text: "text-amber-900",
      border: "border-amber-200",
      icon: Clock,
      label: "VERIFY PAYMENT",
    },
    UNPAID: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
      icon: Clock,
      label: "UNPAID",
    },
  };

  const cfg = map[normalized] || {
    bg: "bg-[#F8F7F3]",
    text: "text-[#121715]",
    border: "border-[#E5E7EB]",
    icon: Sparkles,
    label: normalized || "STATUS",
  };

  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
}

const ORDER_PIPELINE_STAGES = [
  { id: "NEW", label: "Received" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "PREPARING", label: "Preparing" },
  { id: "READY", label: "Ready" },
  { id: "COMPLETED", label: "Completed" },
];

export function OrderLifecyclePipeline({
  status,
  activeStep = 0,
  compact = false,
}: {
  status?: string;
  activeStep?: number;
  compact?: boolean;
}) {
  if (status) {
    if (status === "CANCELLED") {
      return <StatusPill tone="crimson">Order Cancelled</StatusPill>;
    }
    const normalized = status === "SERVED" ? "READY" : status;
    const activeIndex = ORDER_PIPELINE_STAGES.findIndex(
      (s) => s.id === normalized
    );

    return (
      <div
        className={`flex flex-wrap items-center ${
          compact ? "gap-1" : "gap-1.5"
        }`}
        aria-label={`Order status pipeline: ${status}`}
      >
        {ORDER_PIPELINE_STAGES.map((stage, idx) => {
          const isCompleted = activeIndex > idx;
          const isCurrent = activeIndex === idx;
          return (
            <React.Fragment key={stage.id}>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors ${
                  isCurrent
                    ? "bg-[#176B52] text-white"
                    : isCompleted
                    ? "bg-[#E6F7F1] text-[#176B52]"
                    : "bg-[#F8F7F3] text-[#64748B]"
                }`}
              >
                <span>{idx + 1}.</span>
                <span>{stage.label}</span>
              </span>
              {idx < ORDER_PIPELINE_STAGES.length - 1 && (
                <span className="text-[#CBD5E1] text-[10px]">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  const steps = [
    {
      step: "01",
      title: "Customer Scans QR",
      desc: "Instant browser menu — no app download",
      icon: QrCode,
    },
    {
      step: "02",
      title: "Selects & Customises",
      desc: "Portions, dietary tags & spice levels",
      icon: Smartphone,
    },
    {
      step: "03",
      title: "Order Received",
      desc: "Appears on Order Desk with table badge",
      icon: BellRing,
    },
    {
      step: "04",
      title: "Kitchen Prepares",
      desc: "Live KDS ticket & recipe stock deduction",
      icon: ChefHat,
    },
    {
      step: "05",
      title: "Ready & Tracked",
      desc: "Staff marks ready; guest tracker updates",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
      {steps.map((s, idx) => {
        const Icon = s.icon;
        const isCurrent = idx === activeStep;
        return (
          <div
            key={s.step}
            className={`rounded-xl border p-3.5 transition-all ${
              isCurrent
                ? "border-[#176B52] bg-[#E8F3EF]/80 shadow-card"
                : "border-[#E5E7EB] bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold text-[#176B52]">
                STEP {s.step}
              </span>
              <div className="h-7 w-7 rounded-lg bg-[#F8F7F3] text-[#176B52] flex items-center justify-center">
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="font-display font-bold text-xs text-[#121715]">
              {s.title}
            </p>
            {!compact && (
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                {s.desc}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AccessibleModal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = "max-w-lg",
  maxWidthClass,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();
  const resolvedMaxWidth = maxWidthClass || maxWidth;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#121715]/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: 10 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: 8 }
            }
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`w-full ${resolvedMaxWidth} rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-editorial space-y-4 max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-3.5">
              <div>
                <h2 className="font-display font-bold text-lg text-[#121715]">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-[#64748B] hover:text-[#121715] hover:bg-[#F8F7F3] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function EmptyStateCard({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center space-y-3 shadow-card">
      {icon && (
        <div className="mx-auto h-11 w-11 rounded-xl bg-[#E8F3EF] text-[#176B52] flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-md mx-auto">
        <h3 className="font-display font-bold text-base text-[#121715]">
          {title}
        </h3>
        <p className="text-xs text-[#64748B] leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2 flex justify-center">{action}</div>}
    </div>
  );
}
