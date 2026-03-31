"use client";

import { useState } from "react";
import {
  TrendingUp, TrendingDown, FileText,
  ChevronDown, ChevronUp, Download, Brain
} from "lucide-react";
import { exportReportToPDF } from "@/lib/exportPDF";

interface TearSheetData {
  executiveSummary: string;
  bullCase: string[];
  bearCase: string[];
  conclusion: string;
  targetPrice?: string;
  recommendation: "BUY" | "SELL" | "HOLD" | "NEUTRAL";
  confidenceLevel?: string;
  timeHorizon?: string;
}

interface TearSheetProps {
  data: TearSheetData;
  ticker: string;
  reportElementId: string;
}

const REC_CONFIG = {
  BUY:     { color: "oklch(0.70 0.17 142)", bg: "oklch(0.10 0.03 142)", border: "oklch(0.70 0.17 142 / 0.3)", icon: TrendingUp    },
  SELL:    { color: "oklch(0.60 0.22 25)",  bg: "oklch(0.10 0.03 25)",  border: "oklch(0.60 0.22 25 / 0.3)",  icon: TrendingDown   },
  HOLD:    { color: "oklch(0.72 0.18 88)",  bg: "oklch(0.10 0.02 88)",  border: "oklch(0.72 0.18 88 / 0.3)",  icon: FileText       },
  NEUTRAL: { color: "oklch(0.72 0.18 88)",  bg: "oklch(0.10 0.02 88)",  border: "oklch(0.72 0.18 88 / 0.3)",  icon: FileText       },
};

export default function TearSheet({ data, ticker, reportElementId }: TearSheetProps) {
  const [expanded, setExpanded] = useState(true);
  const [exporting, setExporting] = useState(false);

  const cfg = REC_CONFIG[data.recommendation] ?? REC_CONFIG.NEUTRAL;
  const RecIcon = cfg.icon;

  async function handleExport() {
    setExporting(true);
    try {
      await exportReportToPDF(reportElementId, ticker);
    } finally {
      setExporting(false);
    }

  return (
    <div className="bb-panel overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ background: "oklch(0.095 0 0)", borderColor: "oklch(0.14 0 0)" }}
      >
        <div className="flex items-center gap-2">
          <Brain size={11} style={{ color: "oklch(0.72 0.18 88)" }} />
          <span className="label-xs font-bold" style={{ color: "oklch(0.72 0.18 88)" }}>
            AI INVESTMENT MEMO
          </span>
          <span className="label-xs" style={{ color: "oklch(0.30 0 0)" }}>·</span>
          <span className="label-xs" style={{ color: "oklch(0.35 0 0)" }}>
            {ticker} · GEMINI AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Recommendation badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm border"
            style={{ background: cfg.bg, borderColor: cfg.border }}
          >
            <RecIcon size={11} style={{ color: cfg.color }} />
            <span
              className="font-mono font-bold text-[13px] tracking-wider"
              style={{ color: cfg.color }}
            >
              {data.recommendation}
            </span>
          </div>
          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[10px] font-bold tracking-wider transition-all disabled:opacity-40"
            style={{
              color: "oklch(0.55 0 0)",
              borderColor: "oklch(0.18 0 0)",
              background: "oklch(0.10 0 0)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.72 0.18 88 / 0.5)";
              (e.currentTarget as HTMLElement).style.color = "oklch(0.72 0.18 88)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.18 0 0)";
              (e.currentTarget as HTMLElement).style.color = "oklch(0.55 0 0)";
            }}
          >
            <Download size={10} />
            {exporting ? "EXPORTING…" : "PDF"}
          </button>
          {/* Collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-sm transition-colors"
            style={{ color: "oklch(0.40 0 0)" }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Meta row */}
          {(data.targetPrice || data.confidenceLevel || data.timeHorizon) && (
            <div className="flex flex-wrap gap-3">
              {data.targetPrice && (
                <div className="bb-metric flex-1 min-w-24">
                  <div className="label-xs mb-1" style={{ color: "oklch(0.38 0 0)" }}>TARGET PRICE</div>
                  <div className="font-mono font-bold text-[15px]" style={{ color: "oklch(0.70 0.17 142)" }}>
                    {data.targetPrice}
                  </div>
                </div>
              )}
              {data.confidenceLevel && (
                <div className="bb-metric flex-1 min-w-24">
                  <div className="label-xs mb-1" style={{ color: "oklch(0.38 0 0)" }}>CONFIDENCE</div>
                  <div className="font-mono font-bold text-[15px]" style={{ color: "oklch(0.72 0.18 88)" }}>
                    {data.confidenceLevel}
                  </div>
                </div>
              )}
              {data.timeHorizon && (
                <div className="bb-metric flex-1 min-w-24">
                  <div className="label-xs mb-1" style={{ color: "oklch(0.38 0 0)" }}>TIME HORIZON</div>
                  <div className="font-mono font-bold text-[15px]" style={{ color: "oklch(0.75 0.12 200)" }}>
                    {data.timeHorizon}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Executive Summary */}
          <div
            className="p-3 rounded-sm border-l-2"
            style={{
              background: "oklch(0.09 0 0)",
              borderLeftColor: "oklch(0.72 0.18 88)",
            }}
          >
            <p className="label-xs mb-1.5" style={{ color: "oklch(0.72 0.18 88)" }}>
              EXECUTIVE SUMMARY
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: "oklch(0.72 0 0)" }}>
              {data.executiveSummary}
            </p>
          </div>

          {/* Bull / Bear grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bull Case */}
            <div
              className="p-3 rounded-sm border"
              style={{
                background: "oklch(0.09 0.02 142)",
                borderColor: "oklch(0.70 0.17 142 / 0.25)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={11} style={{ color: "oklch(0.70 0.17 142)" }} />
                <span className="label-xs font-bold" style={{ color: "oklch(0.70 0.17 142)" }}>
                  BULL CASE
                </span>
              </div>
              <ul className="space-y-1.5">
                {data.bullCase.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px]" style={{ color: "oklch(0.68 0 0)" }}>
                    <span style={{ color: "oklch(0.70 0.17 142)", flexShrink: 0 }}>▲</span>
                    <span className="leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bear Case */}
            <div
              className="p-3 rounded-sm border"
              style={{
                background: "oklch(0.09 0.02 25)",
                borderColor: "oklch(0.60 0.22 25 / 0.25)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown size={11} style={{ color: "oklch(0.60 0.22 25)" }} />
                <span className="label-xs font-bold" style={{ color: "oklch(0.60 0.22 25)" }}>
                  BEAR CASE · RISKS
                </span>
              </div>
              <ul className="space-y-1.5">
                {data.bearCase.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px]" style={{ color: "oklch(0.68 0 0)" }}>
                    <span style={{ color: "oklch(0.60 0.22 25)", flexShrink: 0 }}>▼</span>
                    <span className="leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Conclusion */}
          <div
            className="p-3 rounded-sm border"
            style={{
              background: cfg.bg,
              borderColor: cfg.border,
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <RecIcon size={11} style={{ color: cfg.color }} />
              <span className="label-xs font-bold" style={{ color: cfg.color }}>
                FINAL CONCLUSION · {data.recommendation}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "oklch(0.72 0 0)" }}>
              {data.conclusion}
            </p>
          </div>

          {/* Disclaimer */}
          <p className="text-[9px] text-center" style={{ color: "oklch(0.28 0 0)" }}>
            AI-GENERATED ANALYSIS · NOT FINANCIAL ADVICE · DO YOUR OWN RESEARCH
          </p>
        </div>
      )}
    </div>
  );
}
