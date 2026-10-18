"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuit,
  Sparkles,
  Send,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Clock,
} from "lucide-react";
import { formatINR } from "@dinepilot/shared";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/AppProviders";

const SUGGESTED_QUESTIONS = [
  "Which five dishes generated the highest gross profit this month?",
  "Which ingredients need replenishment this week?",
  "Which menu items have high sales but weak margins?",
  "How did sales compare with the previous week?",
  "Which dishes are frequently cancelled or returned?",
  "What operational problems should I investigate first?",
];

export default function AiInsightsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [question, setQuestion] = useState("");
  const [dateRangeDays, setDateRangeDays] = useState(30);
  const [activeInsight, setActiveInsight] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: history = [] } = useQuery({
    queryKey: ["ai-history"],
    queryFn: () => apiFetch("/ai/insights/history"),
  });

  async function runCopilotAnalysis(customQuestion?: string) {
    setLoading(true);
    try {
      const q = customQuestion !== undefined ? customQuestion : question;
      const result = await apiFetch("/ai/insights", {
        method: "POST",
        body: JSON.stringify({
          question: q || undefined,
          dateRangeDays,
        }),
      });
      setActiveInsight(result);
      queryClient.invalidateQueries({ queryKey: ["ai-history"] });
    } catch (err: any) {
      toast({
        title: "AI Copilot request failed",
        description: err?.message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runCopilotAnalysis("");
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-[#101820]">
              AI Business Copilot
            </h2>
            <span className="rounded-full bg-[#E8F3EF] border border-[#176B52]/15 px-3 py-0.5 text-[11px] font-bold text-[#101820]">
              {activeInsight?.providerMode === "LLM_ENHANCED"
                ? "LLM Provider Adapter"
                : "Rule-Based Deterministic Engine"}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Metrics are calculated deterministically on the backend first.
            Measured facts and forecasts are explicitly separated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDateRangeDays(d);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                dateRangeDays === d
                  ? "bg-[#176B52] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#64748B]"
              }`}
            >
              {d}d Window
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={() => runCopilotAnalysis(question)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B52] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#125541] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#20A67A] ${
                loading ? "animate-spin" : ""
              }`}
            />
            Re-Analyze
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#176B52]/20 bg-[#176B52] text-white p-6 shadow-editorial space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#20A67A]">
          <Sparkles className="h-4 w-4" />
          <span>Ask Copilot About Your Restaurant Metrics</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runCopilotAnalysis(question);
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Which five dishes generated the highest gross profit this month?"
            className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-[#20A67A]"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#20A67A] px-6 py-3 text-xs font-bold text-[#101820] hover:bg-[#198763] disabled:opacity-60 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            {loading ? "Analyzing..." : "Ask Copilot"}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setQuestion(q);
                runCopilotAnalysis(q);
              }}
              className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 text-[11px] text-[#E6ECE8] transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>

        {activeInsight?.directAnswer && (
          <div className="rounded-xl bg-white text-[#101820] p-4 border-l-4 border-[#20A67A] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#286249]">
              Grounded Answer from Stored Ledger
            </span>
            <p className="text-sm font-medium leading-relaxed">
              {activeInsight.directAnswer}
            </p>
          </div>
        )}
      </div>

      {activeInsight && (
        <>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C6A15B]">
              Executive Telemetry Summary
            </span>
            <p className="text-sm font-semibold text-[#101820] mt-1">
              {activeInsight.executiveSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(activeInsight.measuredHighlights || []).map((hl: any) => (
              <div
                key={hl.id}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          hl.isForecast
                            ? "bg-purple-100 text-purple-900"
                            : "bg-[#E8F3EF] text-[#101820]"
                        }`}
                      >
                        {hl.isForecast
                          ? "FORECAST ESTIMATE"
                          : "MEASURED HISTORICAL DATA"}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          hl.severity === "HIGH"
                            ? "bg-red-100 text-red-900"
                            : hl.severity === "MEDIUM"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-blue-100 text-blue-900"
                        }`}
                      >
                        {hl.severity}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#101820]">
                      {hl.supportingMetricLabel}: {hl.supportingMetricValue}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-[#101820]">
                    {hl.title}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    <strong>Measured Evidence:</strong> {hl.measuredFact}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F8F7F3] border border-[#E5E7EB] p-3 text-xs text-[#101820]">
                  <strong className="text-[#101820]">
                    Recommended Action:
                  </strong>{" "}
                  {hl.recommendation}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900">
                  FORECAST MODEL
                </span>
                <h3 className="font-display font-bold text-base text-[#101820] mt-1">
                  7-Day Ingredient Replenishment Forecast
                </h3>
                <p className="text-xs text-[#64748B]">
                  Projected from historical recipe consumption velocity and
                  current stock on hand
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8F7F3] text-[#64748B]">
                    <th className="py-3 px-4 font-semibold">Ingredient</th>
                    <th className="py-3 px-4 font-semibold">Current Stock</th>
                    <th className="py-3 px-4 font-semibold">
                      Est. Daily Burn
                    </th>
                    <th className="py-3 px-4 font-semibold">
                      Est. Days Remaining
                    </th>
                    <th className="py-3 px-4 font-semibold">
                      Suggested Order Qty
                    </th>
                    <th className="py-3 px-4 font-semibold">
                      Est. Purchase Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {(activeInsight.replenishmentForecasts || []).map(
                    (f: any) => (
                      <tr key={f.ingredientId}>
                        <td className="py-3 px-4 font-bold text-[#101820]">
                          {f.ingredientName}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {f.currentStock} {f.unit} (Min: {f.reorderThreshold}{" "}
                          {f.unit})
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {f.estimatedDailyBurn} {f.unit}/day
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-800">
                          ~{f.estimatedDaysRemaining} days
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#101820]">
                          +{f.suggestedOrderQty} {f.unit}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {formatINR(f.estimatedPurchaseCostPaise)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
