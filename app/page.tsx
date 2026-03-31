'use client';

// app/page.tsx
// Bloomberg-style Institutional Research Terminal
// Tabbed: Research | Compare

import { useState } from 'react';
import TerminalHeader from '@/components/TerminalHeader';
import TickerInput from '@/components/TickerInput';
import MetricCard from '@/components/MetricCard';
import QuantCard from '@/components/QuantCard';
import SentimentPanel from '@/components/SentimentPanel';
import TearSheet from '@/components/TearSheet';
import PriceChart from '@/components/PriceChart';
import ComparisonTable from '@/components/ComparisonTable';
import ComparisonRadar from '@/components/ComparisonRadar';
import { ResearchReport, StockMetrics } from '@/lib/types';
import {
  AlertTriangle, Search, GitCompare,
  BarChart2, Loader2, TrendingUp, TrendingDown, Minus,
  ChevronRight, Activity,
} from 'lucide-react';

const REPORT_ELEMENT_ID = 'research-report';

/* ── Formatters ─────────────────────────────────────────────────── */
function fmtCap(n: number): string {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString();
}
function fmtVol(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  return n.toLocaleString();
}

/* ── Shared states ───────────────────────────────────────────────── */
function PanelHeader({
  label,
  sub,
  accent = 'amber',
}: {
  label: string;
  sub?: string;
  accent?: string;
}) {
  const colors: Record<string, string> = {
    amber:  'oklch(0.72 0.18 88)',
    green:  'oklch(0.70 0.17 142)',
    cyan:   'oklch(0.75 0.12 200)',
    purple: 'oklch(0.65 0.16 285)',
  };
  const c = colors[accent] ?? colors.amber;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 border-b border-[oklch(0.14_0_0)]"
      style={{ background: 'oklch(0.095 0 0)' }}
    >
      <span className="w-1 h-3 rounded-sm" style={{ background: c }} />
      <span className="label-xs font-bold" style={{ color: c }}>
        {label}
      </span>
      {sub && (
        <>
          <ChevronRight size={10} style={{ color: 'oklch(0.28 0 0)' }} />
          <span className="label-xs" style={{ color: 'oklch(0.38 0 0)' }}>{sub}</span>
        </>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, msg }: { icon: React.ElementType; msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Icon size={32} style={{ color: 'oklch(0.22 0 0)' }} />
      <p className="text-[11px] text-center max-w-xs" style={{ color: 'oklch(0.38 0 0)' }}>
        {msg}
      </p>
    </div>
  );
}

function LoadingState({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="flex items-center gap-2">
        <Activity size={14} style={{ color: 'oklch(0.72 0.18 88)' }} className="animate-pulse" />
        <span
          className="label-sm font-bold tracking-widest"
          style={{ color: 'oklch(0.72 0.18 88)' }}
        >
          {msg}
        </span>
      </div>
      <div className="flex gap-1 mt-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-1 h-4 rounded-sm animate-pulse"
            style={{
              background: 'oklch(0.72 0.18 88)',
              animationDelay: `${i * 0.12}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <AlertTriangle size={24} style={{ color: 'oklch(0.60 0.22 25)' }} />
      <p className="label-sm font-bold" style={{ color: 'oklch(0.60 0.22 25)' }}>
        PIPELINE ERROR
      </p>
      <p className="text-[10px] max-w-sm text-center" style={{ color: 'oklch(0.45 0 0)' }}>
        {msg}
      </p>
    </div>
  );
}

/* ── Compare rank config ─────────────────────────────────────────── */
const RANK_CONFIG = {
  0: { icon: TrendingUp,   color: 'oklch(0.70 0.17 142)', label: '#1 PREFERRED', bg: 'oklch(0.10 0.03 142)' },
  1: { icon: Minus,        color: 'oklch(0.72 0.18 88)',  label: '#2 NEUTRAL',   bg: 'oklch(0.10 0.02 88)'  },
  2: { icon: TrendingDown, color: 'oklch(0.60 0.22 25)',  label: '#3 WEAKEST',   bg: 'oklch(0.10 0.03 25)'  },
};

interface CompareAIAnalysis {
  rankedTickers: string[];
  rankingRationale: string;
  perStock: Record<string, { strongestMetric: string; weakestMetric: string; oneLineSummary: string }>;
  keyInsight: string;
  warningFlags: string[];
}
interface CompareResult { stocks: StockMetrics[]; aiAnalysis: CompareAIAnalysis; fetchErrors?: string[] }

/* ══════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {

  const [activeSection, setActiveSection] = useState<'research' | 'compare'>('research');

  /* Research */
  const [report, setReport]       = useState<ResearchReport | null>(null);
  const [rLoading, setRLoading]   = useState(false);
  const [rTicker, setRTicker]     = useState('');
  const [rError, setRError]       = useState('');

  async function handleResearch(ticker: string) {
    setRLoading(true); setRError(''); setRTicker(ticker); setReport(null);
    try {
      const res  = await fetch('/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticker }) });
      const data = await res.json();
      if (!res.ok || data.status === 'error') throw new Error(data.error ?? 'Unknown error.');
      setReport(data);
    } catch (e: unknown) {
      setRError(e instanceof Error ? e.message : 'Unexpected error.');
    } finally { setRLoading(false); }
  }

  /* Compare */
  const [tInputs, setTInputs]         = useState(['', '', '']);
  const [cLoading, setCLoading]       = useState(false);
  const [cResult, setCResult]         = useState<CompareResult | null>(null);
  const [cError, setCError]           = useState('');

  function updateTicker(i: number, v: string) {
    const u = [...tInputs]; u[i] = v.toUpperCase().slice(0, 10); setTInputs(u);
  }
  async function handleCompare() {
    const tickers = tInputs.map(t => t.trim()).filter(Boolean);
    if (tickers.length < 2) { setCError('Enter at least 2 ticker symbols.'); return; }
    setCLoading(true); setCError(''); setCResult(null);
    try {
      const res  = await fetch('/api/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tickers }) });
      const data = await res.json();
      if (!res.ok || data.status === 'error') throw new Error(data.error ?? 'Unknown error.');
      setCResult(data);
    } catch (e: unknown) {
      setCError(e instanceof Error ? e.message : 'Unexpected error.');
    } finally { setCLoading(false); }
  }

  /* ── RESEARCH RENDER ─────────────────────────────────────────── */
  function renderResearch() {
    if (rLoading) return <LoadingState msg={`FETCHING ${rTicker}…`} />;
    if (rError)   return <ErrorState msg={rError} />;
    if (!report)  return (
      <EmptyState
        icon={Search}
        msg="Enter a ticker symbol above and press ANALYZE to run the full institutional research pipeline."
      />
    );

    const m = report.metrics;
    const isUp = m.priceChange >= 0;
    const vsHigh = ((m.price - m.fiftyTwoWeekHigh) / m.fiftyTwoWeekHigh * 100).toFixed(1);

    return (
      <div id={REPORT_ELEMENT_ID} className="space-y-3">

        {/* ── Company header bar ── */}
        <div
          className="bb-panel p-3"
          style={{ borderTopColor: isUp ? 'oklch(0.70 0.17 142)' : 'oklch(0.60 0.22 25)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span
                  className="font-mono font-bold tracking-tight"
                  style={{ fontSize: '26px', color: 'oklch(0.92 0 0)', letterSpacing: '-0.02em' }}
                >
                  {m.ticker}
                </span>
                <span className="text-[11px]" style={{ color: 'oklch(0.50 0 0)' }}>
                  {m.companyName}
                </span>
              </div>
              <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                <span
                  className="font-mono font-semibold tabular-nums"
                  style={{ fontSize: '22px', color: 'oklch(0.92 0 0)' }}
                >
                  ${m.price.toFixed(2)}
                </span>
                <span
                  className="font-mono font-semibold text-[13px] tabular-nums"
                  style={{ color: isUp ? 'oklch(0.70 0.17 142)' : 'oklch(0.60 0.22 25)' }}
                >
                  {isUp ? '▲' : '▼'} {Math.abs(m.priceChange).toFixed(2)} ({isUp ? '+' : ''}{m.priceChangePct.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Right: timestamp + market status */}
            <div className="text-right">
              <div
                className="label-xs mb-1"
                style={{ color: 'oklch(0.40 0 0)' }}
              >
                LAST UPDATED
              </div>
              <div className="font-mono text-[11px]" style={{ color: 'oklch(0.55 0 0)' }}>
                {new Date(m.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit', second: '2-digit'
                })} EST
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[oklch(0.70_0.17_142)]" />
                <span className="label-xs" style={{ color: 'oklch(0.70 0.17 142)' }}>LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI grid ── */}
        <div className="bb-panel overflow-hidden">
          <PanelHeader label="KEY METRICS" sub="REAL-TIME DATA" accent="amber" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[oklch(0.13_0_0)] p-px">
            {[
              { label: 'MARKET CAP',    value: fmtCap(m.marketCap),  accent: 'amber' as const  },
              { label: 'VOLUME',        value: fmtVol(m.volume),     subValue: `AVG ${fmtVol(m.avgVolume)}`, accent: 'none' as const },
              { label: 'P/E RATIO',     value: m.peRatio ? m.peRatio.toFixed(1) + 'x' : 'N/A',
                                        accent: m.peRatio && m.peRatio > 25 ? 'red' as const : 'none' as const,
                                        highlight: !!(m.peRatio && m.peRatio > 25) },
              { label: 'PEG RATIO',     value: m.pegRatio ? m.pegRatio.toFixed(2) : 'N/A', accent: 'none' as const },
              { label: 'DEBT/EQUITY',   value: m.debtToEquity ? m.debtToEquity.toFixed(2) : 'N/A', accent: 'none' as const },
              { label: 'FREE CASH FLOW', value: m.freeCashFlow ? '$' + m.freeCashFlow.toLocaleString() + 'M' : 'N/A',
                                         accent: 'green' as const, highlight: true },
              { label: 'REV GROWTH YOY', value: m.revenueGrowthYoY !== null ? (m.revenueGrowthYoY >= 0 ? '+' : '') + m.revenueGrowthYoY + '%' : 'N/A',
                                          subValueColor: m.revenueGrowthYoY !== null && m.revenueGrowthYoY >= 0 ? 'green' as const : 'red' as const,
                                          accent: 'cyan' as const },
              { label: 'GROSS MARGIN',  value: m.grossMargin !== null ? m.grossMargin + '%' : 'N/A', accent: 'none' as const },
              { label: 'EPS',           value: m.eps !== null ? '$' + m.eps.toFixed(2) : 'N/A', accent: 'none' as const },
              { label: '52W HIGH',      value: '$' + m.fiftyTwoWeekHigh.toFixed(2), accent: 'none' as const },
              { label: '52W LOW',       value: '$' + m.fiftyTwoWeekLow.toFixed(2), accent: 'none' as const },
              { label: 'VS 52W HIGH',   value: vsHigh + '%',
                                        accent: parseFloat(vsHigh) < -20 ? 'red' as const : 'none' as const,
                                        highlight: parseFloat(vsHigh) < -20,
                                        delta: parseFloat(vsHigh) < 0 ? 'down' as const : 'up' as const },
            ].map((card, i) => (
              <MetricCard key={i} {...card} />
            ))}
          </div>
        </div>

        {/* ── Chart ── */}
        <PriceChart candles={report.priceHistory} ticker={m.ticker} currentPrice={m.price} />

        {/* ── Quant + Sentiment side by side ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <QuantCard flags={report.quantFlags} />
          <SentimentPanel news={report.news} />
        </div>

        {/* ── AI Tear Sheet ── */}
        {report.tearSheet && (
          <TearSheet
            data={report.tearSheet}
            ticker={m.ticker}
            reportElementId={REPORT_ELEMENT_ID}
          />
        )}
      </div>
    );
  }

  /* ── COMPARE RENDER ──────────────────────────────────────────── */
  function renderCompare() {
    return (
      <div className="space-y-3">
        {/* Input panel */}
        <div className="bb-panel overflow-hidden">
          <PanelHeader label="COMPARISON ENGINE" sub="2–3 TICKERS" accent="cyan" />
          <div className="p-4">
            <div className="flex gap-2 flex-wrap items-end">
              {tInputs.map((val, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <label className="label-xs" style={{ color: 'oklch(0.40 0 0)' }}>
                    {i === 2 ? 'STOCK 3 (OPT)' : `STOCK ${i + 1}`}
                  </label>
                  <input
                    value={val}
                    onChange={(e) => updateTicker(i, e.target.value)}
                    placeholder={['NVDA', 'AMD', 'INTC'][i]}
                    disabled={cLoading}
                    className="w-24 h-8 px-2.5 font-mono text-[12px] uppercase bg-[oklch(0.10_0_0)] border border-[oklch(0.18_0_0)] rounded-sm outline-none tracking-wider"
                    style={{ color: 'oklch(0.72 0.18 88)' }}
                    onFocus={e => (e.target.style.borderColor = 'oklch(0.72 0.18 88)')}
                    onBlur={e  => (e.target.style.borderColor = 'oklch(0.18 0 0)')}
                  />
                </div>
              ))}
              <button
                onClick={handleCompare}
                disabled={cLoading || tInputs.filter(t => t.trim()).length < 2}
                className="h-8 px-5 flex items-center gap-2 font-mono font-bold text-[11px] tracking-widest rounded-sm transition-all disabled:opacity-40"
                style={{
                  background: 'oklch(0.72 0.18 88)',
                  color: 'oklch(0.06 0 0)',
                }}
              >
                {cLoading
                  ? <><Loader2 size={12} className="animate-spin" /> ANALYZING</>
                  : <><GitCompare size={12} /> RUN COMPARE</>
                }
              </button>
            </div>
            {cError && (
              <p className="mt-2 text-[10px]" style={{ color: 'oklch(0.60 0.22 25)' }}>
                ⚠ {cError}
              </p>
            )}
          </div>
        </div>

        {cLoading && <LoadingState msg="RUNNING INSTITUTIONAL COMPARISON…" />}

        {cResult && (() => {
          const { stocks, aiAnalysis, fetchErrors } = cResult;
          return (
            <>
              {fetchErrors && fetchErrors.length > 0 && (
                <div
                  className="flex items-start gap-2 p-3 text-[10px] rounded-sm border"
                  style={{ background: 'oklch(0.10 0.02 88)', borderColor: 'oklch(0.20 0.05 88)' }}
                >
                  <AlertTriangle size={12} style={{ color: 'oklch(0.72 0.18 88)' }} />
                  <span style={{ color: 'oklch(0.72 0.18 88)' }}>
                    PARTIAL DATA: {fetchErrors.join('; ')}
                  </span>
                </div>
              )}

              {/* AI Rankings */}
              <div className="bb-panel overflow-hidden">
                <PanelHeader label="AI RANKING" sub="ZERO-BIAS ASSESSMENT" accent="amber" />
                <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {aiAnalysis.rankedTickers.map((ticker, rankIdx) => {
                    const stock  = stocks.find(s => s.ticker === ticker);
                    const per    = aiAnalysis.perStock[ticker];
                    const cfg    = RANK_CONFIG[rankIdx as 0 | 1 | 2];
                    const Icon   = cfg.icon;
                    return (
                      <div
                        key={ticker}
                        className="rounded-sm border p-3 space-y-2"
                        style={{ background: cfg.bg, borderColor: cfg.color + '40' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon size={14} style={{ color: cfg.color }} />
                            <span className="font-mono font-bold text-[16px]" style={{ color: cfg.color }}>
                              {ticker}
                            </span>
                          </div>
                          <span
                            className="label-xs border px-1.5 py-0.5 rounded-sm font-bold"
                            style={{ color: cfg.color, borderColor: cfg.color + '60' }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        {stock && (
                          <p className="text-[10px]" style={{ color: 'oklch(0.42 0 0)' }}>
                            {stock.companyName}
                          </p>
                        )}
                        {per && (
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex items-start gap-1.5">
                              <span style={{ color: 'oklch(0.70 0.17 142)' }}>▲</span>
                              <span style={{ color: 'oklch(0.75 0 0)' }}>{per.strongestMetric}</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span style={{ color: 'oklch(0.60 0.22 25)' }}>▼</span>
                              <span style={{ color: 'oklch(0.55 0 0)' }}>{per.weakestMetric}</span>
                            </div>
                            <div
                              className="pt-1.5 border-t text-[10px] italic"
                              style={{ borderColor: 'oklch(0.18 0 0)', color: 'oklch(0.45 0 0)' }}
                            >
                              {per.oneLineSummary}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rationale */}
              <div className="bb-panel overflow-hidden">
                <PanelHeader label="RANKING RATIONALE" accent="cyan" />
                <p className="p-4 text-[11px] leading-relaxed" style={{ color: 'oklch(0.68 0 0)' }}>
                  {aiAnalysis.rankingRationale}
                </p>
              </div>

              <ComparisonRadar stocks={stocks} />

              {/* Side-by-side table */}
              <div className="bb-panel overflow-hidden">
                <PanelHeader label="METRICS COMPARISON" sub="SIDE BY SIDE" accent="purple" />
                <ComparisonTable stocks={stocks} />
              </div>

              {/* Key insight */}
              <div
                className="rounded-sm border p-4 space-y-1"
                style={{ background: 'oklch(0.09 0.02 142)', borderColor: 'oklch(0.70 0.17 142 / 0.3)' }}
              >
                <p className="label-xs font-bold" style={{ color: 'oklch(0.70 0.17 142)' }}>
                  KEY INSIGHT
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'oklch(0.78 0 0)' }}>
                  {aiAnalysis.keyInsight}
                </p>
              </div>

              {aiAnalysis.warningFlags?.length > 0 && (
                <div
                  className="rounded-sm border p-4 space-y-2"
                  style={{ background: 'oklch(0.09 0.02 88)', borderColor: 'oklch(0.72 0.18 88 / 0.3)' }}
                >
                  <p className="label-xs font-bold" style={{ color: 'oklch(0.72 0.18 88)' }}>
                    WARNING FLAGS
                  </p>
                  {aiAnalysis.warningFlags.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]"
                      style={{ color: 'oklch(0.72 0 0)' }}>
                      <AlertTriangle size={11} style={{ color: 'oklch(0.72 0.18 88)', flexShrink: 0, marginTop: '1px' }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {!cLoading && !cResult && !cError && (
          <EmptyState icon={GitCompare} msg="Enter 2–3 ticker symbols and click RUN COMPARE to start." />
        )}
      </div>
    );
  }

  /* ── LAYOUT ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.055 0 0)', color: 'oklch(0.91 0 0)' }}>
      <TerminalHeader activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="max-w-screen-xl mx-auto px-3 py-4 space-y-3 relative z-10">

        {/* Section label */}
        <div className="flex items-center gap-2">
          {activeSection === 'research'
            ? <BarChart2 size={12} style={{ color: 'oklch(0.72 0.18 88)' }} />
            : <GitCompare size={12} style={{ color: 'oklch(0.75 0.12 200)' }} />
          }
          <span
            className="label-sm font-bold"
            style={{ color: activeSection === 'research' ? 'oklch(0.72 0.18 88)' : 'oklch(0.75 0.12 200)' }}
          >
            {activeSection === 'research' ? 'SINGLE STOCK RESEARCH' : 'COMPETITOR COMPARISON'}
          </span>
          <span className="flex-1 h-px" style={{ background: 'oklch(0.14 0 0)' }} />
          <span className="label-xs" style={{ color: 'oklch(0.30 0 0)' }}>
            {activeSection === 'research' ? 'FULL INSTITUTIONAL PIPELINE' : '2–3 STOCKS · AI RANKED'}
          </span>
        </div>

        {/* Search bar (only on research tab) */}
        {activeSection === 'research' && (
          <TickerInput onSearch={handleResearch} isLoading={rLoading} />
        )}

        {/* Content */}
        {activeSection === 'research' ? renderResearch() : renderCompare()}
      </main>

      {/* Footer */}
      <footer
        className="border-t px-4 py-3 mt-6 relative z-10"
        style={{ borderColor: 'oklch(0.13 0 0)', background: 'oklch(0.065 0 0)' }}
      >
        <p className="label-xs text-center" style={{ color: 'oklch(0.28 0 0)' }}>
          DATA: FINNHUB · ALPHA VANTAGE &nbsp;│&nbsp; AI: GOOGLE GEMINI &nbsp;│&nbsp;
          THIS PLATFORM DOES NOT CONSTITUTE FINANCIAL ADVICE
        </p>
      </footer>
    </div>
  );
}
