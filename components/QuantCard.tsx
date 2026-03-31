"use client";

import { TrendingUp, TrendingDown, Minus, ShieldAlert, ShieldCheck } from "lucide-react";

interface QuantFlag {
  label: string;
  value: string;
  signal: "bullish" | "bearish" | "neutral";
  detail?: string;
}

interface QuantCardProps {
  flags: QuantFlag[];
}

const SIGNAL_CONFIG = {
  bullish: {
    color: "oklch(0.70 0.17 142)",
    bg: "oklch(0.10 0.03 142)",
    border: "oklch(0.70 0.17 142 / 0.25)",
    icon: TrendingUp,
    label: "BULL",
  },
  bearish: {
    color: "oklch(0.60 0.22 25)",
    bg: "oklch(0.10 0.03 25)",
    border: "oklch(0.60 0.22 25 / 0.25)",
    icon: TrendingDown,
    label: "BEAR",
  },
  neutral: {
    color: "oklch(0.72 0.18 88)",
    bg: "oklch(0.10 0.02 88)",
    border: "oklch(0.72 0.18 88 / 0.25)",
    icon: Minus,
    label: "NTRL",
  },
};

export default function QuantCard({ flags }: QuantCardProps) {
  const bullCount = flags.filter((f) => f.signal === "bullish").length;
  const bearCount = flags.filter((f) => f.signal === "bearish").length;
  const overallSignal =
    bullCount > bearCount ? "bullish" : bearCount > bullCount ? "bearish" : "neutral";
  const overallCfg = SIGNAL_CONFIG[overallSignal];
  const OverallIcon = overallSignal === "bullish" ? ShieldCheck : overallSignal === "bearish" ? ShieldAlert : Minus;

  return (
    <div className="bb-panel overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ background: "oklch(0.095 0 0)", borderColor: "oklch(0.14 0 0)" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1 h-3 rounded-sm" style={{ background: "oklch(0.75 0.12 200)" }} />
          <span className="label-xs font-bold" style={{ color: "oklch(0.75 0.12 200)" }}>
            QUANTITATIVE FLAGS
          </span>
        </div>
        {/* Overall signal badge */}
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm border"
          style={{
            background: overallCfg.bg,
            borderColor: overallCfg.border,
          }}
        >
          <OverallIcon size={10} style={{ color: overallCfg.color }} />
          <span
            className="label-xs font-bold"
            style={{ color: overallCfg.color }}
          >
            {overallSignal.toUpperCase()} · {bullCount}B / {bearCount}S
          </span>
        </div>
      </div>

      {/* Flags list */}
      <div className="divide-y" style={{ divideColor: "oklch(0.13 0 0)" }}>
        {flags.map((flag, i) => {
          const cfg = SIGNAL_CONFIG[flag.signal];
          const Icon = cfg.icon;
          return (
            <div
              key={i}
              className="flex items-start gap-3 px-3 py-2.5 bb-row"
            >
              {/* Signal icon */}
              <div
                className="flex items-center justify-center w-5 h-5 rounded-sm flex-shrink-0 mt-0.5"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <Icon size={10} style={{ color: cfg.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="text-[10px] font-semibold tracking-wide"
                    style={{ color: "oklch(0.80 0 0)" }}
                  >
                    {flag.label}
                  </span>
                  <span
                    className="font-mono text-[11px] font-bold tabular-nums flex-shrink-0"
                    style={{ color: cfg.color }}
                  >
                    {flag.value}
                  </span>
                </div>
                {flag.detail && (
                  <p
                    className="text-[10px] mt-0.5 leading-relaxed"
                    style={{ color: "oklch(0.42 0 0)" }}
                  >
                    {flag.detail}
                  </p>
                )}
              </div>

              {/* Signal badge */}
              <span
                className="label-xs font-bold px-1.5 py-0.5 rounded-sm border flex-shrink-0"
                style={{
                  color: cfg.color,
                  borderColor: cfg.border,
                  background: cfg.bg,
                }}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
