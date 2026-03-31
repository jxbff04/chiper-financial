"use client";

import { ExternalLink, TrendingUp, TrendingDown, Minus, Newspaper } from "lucide-react";

interface NewsItem {
  headline: string;
  source: string;
  url: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  impact: string;
  publishedAt: string;
}

interface SentimentPanelProps {
  news: NewsItem[];
}

const SENTIMENT_CONFIG = {
  positive: {
    color: "oklch(0.70 0.17 142)",
    bg: "oklch(0.10 0.03 142)",
    border: "oklch(0.70 0.17 142 / 0.25)",
    icon: TrendingUp,
    label: "POS",
  },
  negative: {
    color: "oklch(0.60 0.22 25)",
    bg: "oklch(0.10 0.03 25)",
    border: "oklch(0.60 0.22 25 / 0.25)",
    icon: TrendingDown,
    label: "NEG",
  },
  neutral: {
    color: "oklch(0.72 0.18 88)",
    bg: "oklch(0.10 0.02 88)",
    border: "oklch(0.72 0.18 88 / 0.25)",
    icon: Minus,
    label: "NTR",
  },
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(Math.abs(score) * 100);
  const isPos = score >= 0;
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex-1 h-1 rounded-full overflow-hidden"
        style={{ background: "oklch(0.14 0 0)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: isPos ? "oklch(0.70 0.17 142)" : "oklch(0.60 0.22 25)",
          }}
        />
      </div>
      <span
        className="font-mono text-[9px] tabular-nums w-7 text-right"
        style={{ color: isPos ? "oklch(0.70 0.17 142)" : "oklch(0.60 0.22 25)" }}
      >
        {isPos ? "+" : ""}{score.toFixed(2)}
      </span>
    </div>
  );
}

export default function SentimentPanel({ news }: SentimentPanelProps) {
  const posCount = news.filter((n) => n.sentiment === "positive").length;
  const negCount = news.filter((n) => n.sentiment === "negative").length;
  const avgScore = news.reduce((a, b) => a + b.sentimentScore, 0) / news.length;
  const overallSentiment = avgScore > 0.1 ? "positive" : avgScore < -0.1 ? "negative" : "neutral";
  const overallCfg = SENTIMENT_CONFIG[overallSentiment];

  return (
    <div className="bb-panel overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ background: "oklch(0.095 0 0)", borderColor: "oklch(0.14 0 0)" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1 h-3 rounded-sm" style={{ background: "oklch(0.65 0.16 285)" }} />
          <span className="label-xs font-bold" style={{ color: "oklch(0.65 0.16 285)" }}>
            NEWS SENTIMENT
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px]" style={{ color: "oklch(0.38 0 0)" }}>
            {posCount}▲ {negCount}▼
          </span>
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-sm border"
            style={{ background: overallCfg.bg, borderColor: overallCfg.border }}
          >
            <span className="label-xs font-bold" style={{ color: overallCfg.color }}>
              {overallSentiment.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y" style={{ divideColor: "oklch(0.13 0 0)" }}>
        {news.map((item, i) => {
          const cfg = SENTIMENT_CONFIG[item.sentiment];
          const Icon = cfg.icon;
          return (
            <div key={i} className="px-3 py-2.5 bb-row space-y-1.5">
              <div className="flex items-start gap-2">
                <div
                  className="flex items-center justify-center w-5 h-5 rounded-sm flex-shrink-0 mt-0.5"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <Icon size={10} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-1 group"
                  >
                    <span
                      className="text-[11px] leading-snug line-clamp-2 group-hover:underline"
                      style={{ color: "oklch(0.80 0 0)" }}
                    >
                      {item.headline}
                    </span>
                    <ExternalLink
                      size={9}
                      className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "oklch(0.50 0 0)" }}
                    />
                  </a>
                </div>
              </div>

              <ScoreBar score={item.sentimentScore} />

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Newspaper size={8} style={{ color: "oklch(0.35 0 0)" }} />
                  <span className="text-[9px]" style={{ color: "oklch(0.38 0 0)" }}>
                    {item.source}
                  </span>
                  <span style={{ color: "oklch(0.24 0 0)" }}>·</span>
                  <span className="text-[9px]" style={{ color: "oklch(0.32 0 0)" }}>
                    {item.publishedAt}
                  </span>
                </div>
                <span
                  className="label-xs font-bold px-1.5 py-0.5 rounded-sm border flex-shrink-0"
                  style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}
                >
                  {cfg.label}
                </span>
              </div>

              {item.impact && (
                <p
                  className="text-[10px] leading-relaxed pl-7"
                  style={{ color: "oklch(0.42 0 0)" }}
                >
                  {item.impact}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
