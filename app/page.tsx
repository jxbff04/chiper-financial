// app/page.tsx
// Single scrollable page — Research + Compare
// Report section has id="research-report" for PDF capture

'use client';

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  Activity, AlertTriangle, Search,
  GitCompare, BarChart2, Loader2,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

// The DOM element ID that html2canvas will capture for PDF export
const REPORT_ELEMENT_ID = 'research-report';

// ── Formatting helpers ────────────────────────────────────────────

function formatMarketCap(n: number): string {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString();
}

function formatVolume(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  return n.toLocaleString();
}

// ── Shared UI primitives ──────────────────────────────────────────

function IdleState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Search size={36} className="text-muted-foreground opacity-30" />
      <p className="text-sm text-muted-foreground text-center max-w-sm">{message}</p>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
        <span className="text-sm text-emerald-400 font-bold tracking-widest uppercase">
          {message}
        </span>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertTriangle size={28} className="text-red-400" />
      <p className="text-sm text-red-400 font-bold">Pipeline Error</p>
      <p className="text-xs text-muted-foreground max-w-md text-center">{message}</p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-emerald-400" />
        <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
          {title}
        </h2>
      </div>
      <div className="flex-1 border-t border-border" />
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest shrink-0">
        {subtitle}
      </span>
    </div>
  );
}

// ── Compare types ─────────────────────────────────────────────────

interface CompareAIAnalysis {
  rankedTickers: string[];
  rankingRationale: string;
  perStock: Record<string, {
    strongestMetric: string;
    weakestMetric: string;
    oneLineSummary: string;
  }>;
  keyInsight: string;
  warningFlags: string[];
}

interface CompareResult {
  stocks: StockMetrics[];
  aiAnalysis: CompareAIAnalysis;
  fetchErrors?: string[];
}

const RANK_CONFIG = {
  0: { icon: TrendingUp,   color: 'text-emerald-400', badge: 'bg-emerald-950 text-emerald-400 border-emerald-700', label: '#1 PREFERRED' },
  1: { icon: Minus,        color: 'text-yellow-400',  badge: 'bg-yellow-950 text-yellow-400 border-yellow-700',   label: '#2 NEUTRAL'   },
  2: { icon: TrendingDown, color: 'text-red-400',     badge: 'bg-red-950 text-red-400 border-red-700',            label: '#3 WEAKEST'   },
};

// ── Main Page ─────────────────────────────────────────────────────

export default function DashboardPage() {

  // ── Research state ──
  const [report, setReport]               = useState<ResearchReport | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchTicker, setResearchTicker]   = useState('');
  const [researchError, setResearchError]     = useState('');

  async function handleResearchSearch(ticker: string) {
    setResearchLoading(true);
    setResearchError('');
    setResearchTicker(ticker);
    setReport(null);
    try {
      const res  = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });
      const data = await res.json();
      if (!res.ok || data.status === 'error') throw new Error(data.error ?? 'Unknown error.');
      setReport(data);
    } catch (err: unknown) {
      setResearchError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setResearchLoading(false);
    }
  }

  // ── Compare state ──
  const [tickerInputs, setTickerInputs]     = useState(['', '', '']);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult]   = useState<CompareResult | null>(null);
  const [compareError, setCompareError]     = useState('');

  function updateTicker(index: number, value: string) {
    const updated = [...tickerInputs];
    updated[index] = value.toUpperCase().slice(0, 10);
    setTickerInputs(updated);
  }

  async function handleCompare() {
    const tickers = tickerInputs.map((t) => t.trim()).filter((t) => t.length > 0);
    if (tickers.length < 2) { setCompareError('Enter at least 2 ticker symbols.'); return; }
    setCompareLoading(true);
    setCompareError('');
    setCompareResult(null);
    try {
      const res  = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers }),
      });
      const data = await res.json();
      if (!res.ok || data.status === 'error') throw new Error(data.error ?? 'Unknown error.');
      setCompareResult(data);
    } catch (err: unknown) {
      setCompareError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setCompareLoading(false);
    }
  }

  // ── Research render ───────────────────────────────────────────
  const renderResearch = () => {
    if (researchLoading) return <LoadingState message={'Analyzing ' + researchTicker + '...'} />;
    if (researchError)   return <ErrorState message={researchError} />;
    if (!report)         return <IdleState message="Enter a ticker above to run the full institutional research pipeline." />;

    const m = report.metrics;
    const isPositive = m.priceChange >= 0;

    return (
      // This div is what html2canvas will capture for PDF export
      <div id={REPORT_ELEMENT_ID} className="space-y-5">

        {/* Company header */}
        <div className="flex items-baseline gap-4 flex-wrap">
          <div>
            <span className="text-3xl font-black tracking-tight">{m.ticker}</span>
            <span className="text-sm text-muted-foreground ml-3">{m.companyName}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">${m.price.toFixed(2)}</span>
            <span className={'text-sm font-bold ' + (isPositive ? 'text-emerald-400' : 'text-red-400')}>
              {isPositive ? '+' : ''}{m.priceChange.toFixed(2)} ({isPositive ? '+' : ''}{m.priceChangePct.toFixed(2)}%)
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground ml-auto">
            Last updated: {new Date(m.timestamp).toLocaleTimeString()}
          </span>
        </div>

        <Separator className="bg-border" />

        {/* KPI Cards */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Key Metrics</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <MetricCard label="Market Cap"     value={formatMarketCap(m.marketCap)} />
            <MetricCard label="Volume"         value={formatVolume(m.volume)} subValue={'Avg: ' + formatVolume(m.avgVolume)} />
            <MetricCard label="P/E Ratio"      value={m.peRatio ? m.peRatio.toFixed(1) + 'x' : 'N/A'} highlight={!!m.peRatio && m.peRatio > 25} />
            <MetricCard label="PEG Ratio"      value={m.pegRatio ? m.pegRatio.toFixed(2) : 'N/A'} />
            <MetricCard label="Debt / Equity"  value={m.debtToEquity ? m.debtToEquity.toFixed(2) : 'N/A'} />
            <MetricCard label="Free Cash Flow" value={m.freeCashFlow ? '$' + m.freeCashFlow.toLocaleString() + 'M' : 'N/A'} highlight />
            <MetricCard label="Rev Growth YoY" value={m.revenueGrowthYoY !== null ? (m.revenueGrowthYoY >= 0 ? '+' : '') + m.revenueGrowthYoY + '%' : 'N/A'} subValueColor={m.revenueGrowthYoY !== null && m.revenueGrowthYoY >= 0 ? 'green' : 'red'} />
            <MetricCard label="Gross Margin"   value={m.grossMargin !== null ? m.grossMargin + '%' : 'N/A'} />
            <MetricCard label="EPS"            value={m.eps !== null ? '$' + m.eps.toFixed(2) : 'N/A'} />
            <MetricCard label="52W High"       value={'$' + m.fiftyTwoWeekHigh.toFixed(2)} />
            <MetricCard label="52W Low"        value={'$' + m.fiftyTwoWeekLow.toFixed(2)} />
            <MetricCard label="vs 52W High"    value={(((m.price - m.fiftyTwoWeekHigh) / m.fiftyTwoWeekHigh) * 100).toFixed(1) + '%'} subValueColor="red" />
          </div>
        </div>

        {/* Price chart */}
        <PriceChart candles={report.priceHistory} ticker={m.ticker} currentPrice={m.price} />

        {/* Quant + Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <QuantCard flags={report.quantFlags} />
          <SentimentPanel news={report.news} />
        </div>

        {/* Tear sheet — passes ticker and report element ID for PDF export */}
        {report.tearSheet && (
          <TearSheet
            data={report.tearSheet}
            ticker={m.ticker}
            reportElementId={REPORT_ELEMENT_ID}
          />
        )}
      </div>
    );
  };

  // ── Compare render ────────────────────────────────────────────
  const renderCompare = () => (
    <div className="space-y-5">
      <Card className="border-border bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Select Stocks to Compare (2–3 tickers)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex gap-2 flex-wrap items-end">
            {tickerInputs.map((val, i) => (
              <div key={i} className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {i === 2 ? 'Stock 3 (optional)' : 'Stock ' + (i + 1)}
                </label>
                <Input
                  value={val}
                  onChange={(e) => updateTicker(i, e.target.value)}
                  placeholder={['NVDA', 'AMD', 'INTC'][i]}
                  className="w-28 bg-secondary border-border font-mono text-sm uppercase focus:border-emerald-700"
                  disabled={compareLoading}
                />
              </div>
            ))}
            <Button
              onClick={handleCompare}
              disabled={compareLoading || tickerInputs.filter((t) => t.trim()).length < 2}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold tracking-wider px-5 mb-0.5"
            >
              {compareLoading
                ? <><Loader2 size={13} className="animate-spin mr-2" />COMPARING</>
                : <><GitCompare size={13} className="mr-2" />RUN COMPARISON</>
              }
            </Button>
          </div>
          {compareError && <p className="text-xs text-red-400 mt-3">{compareError}</p>}
        </CardContent>
      </Card>

      {compareLoading && <LoadingState message="Running institutional comparison..." />}

      {compareResult && (() => {
        const { stocks, aiAnalysis, fetchErrors } = compareResult;
        return (
          <>
            {fetchErrors && fetchErrors.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-950/30 border border-yellow-900 rounded text-xs text-yellow-400">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <span>Partial data: {fetchErrors.join('; ')}</span>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                AI Ranking — Zero-Bias Assessment
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiAnalysis.rankedTickers.map((ticker, rankIdx) => {
                  const stock    = stocks.find((s) => s.ticker === ticker);
                  const perStock = aiAnalysis.perStock[ticker];
                  const config   = RANK_CONFIG[rankIdx as 0 | 1 | 2];
                  const Icon     = config.icon;
                  return (
                    <Card key={ticker} className="border-border bg-card">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon size={16} className={config.color} />
                            <span className="text-lg font-black">{ticker}</span>
                          </div>
                          <Badge variant="outline" className={'text-[9px] font-bold ' + config.badge}>
                            {config.label}
                          </Badge>
                        </div>
                        {stock && (
                          <p className="text-[10px] text-muted-foreground truncate">{stock.companyName}</p>
                        )}
                        {perStock && (
                          <div className="space-y-2 text-xs">
                            <div className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold shrink-0">+</span>
                              <span className="text-zinc-300">{perStock.strongestMetric}</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="text-red-500 font-bold shrink-0">-</span>
                              <span className="text-zinc-400">{perStock.weakestMetric}</span>
                            </div>
                            <Separator className="bg-border" />
                            <p className="text-muted-foreground italic">{perStock.oneLineSummary}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Ranking Rationale</p>
                <p className="text-xs text-zinc-300 leading-relaxed">{aiAnalysis.rankingRationale}</p>
              </CardContent>
            </Card>

            <ComparisonRadar stocks={stocks} />

            <Card className="border-border bg-card">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Side-by-Side Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-4">
                <ComparisonTable stocks={stocks} />
              </CardContent>
            </Card>

            <Card className="border-emerald-900 bg-emerald-950/20">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-widest text-emerald-600 mb-2">Key Insight</p>
                <p className="text-xs text-emerald-100 leading-relaxed">{aiAnalysis.keyInsight}</p>
              </CardContent>
            </Card>

            {aiAnalysis.warningFlags?.length > 0 && (
              <Card className="border-yellow-900 bg-yellow-950/20">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase tracking-widest text-yellow-600 mb-2">Warning Flags</p>
                  <div className="space-y-1.5">
                    {aiAnalysis.warningFlags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-yellow-200">
                        <AlertTriangle size={11} className="text-yellow-500 shrink-0 mt-0.5" />
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        );
      })()}

      {!compareLoading && !compareResult && !compareError && (
        <IdleState message="Enter 2–3 ticker symbols above and click RUN COMPARISON." />
      )}
    </div>
  );

  // ── Page layout ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-400" />
          <span className="text-sm font-bold tracking-widest uppercase">
            Institutional Research Terminal
          </span>
          <span className="text-[10px] text-muted-foreground ml-2 border border-border px-1.5 py-0.5 rounded">
            BETA
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
          ZERO-BIAS ENGINE v1.0 · NOT FINANCIAL ADVICE
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        {/* SECTION 1 — RESEARCH */}
        <section className="space-y-5">
          <SectionHeader
            icon={BarChart2}
            title="Single Stock Research"
            subtitle="Full Institutional Pipeline"
          />
          <TickerInput onSearch={handleResearchSearch} isLoading={researchLoading} />
          {renderResearch()}
        </section>

        <div className="border-t-2 border-dashed border-border" />

        {/* SECTION 2 — COMPARE */}
        <section className="space-y-5">
          <SectionHeader
            icon={GitCompare}
            title="Competitor Comparison"
            subtitle="2–3 Stocks · AI Ranked"
          />
          {renderCompare()}
        </section>

      </main>

      <footer className="border-t border-border px-6 py-4 mt-10">
        <p className="text-[10px] text-muted-foreground text-center">
          Data: Finnhub · Alpha Vantage · AI: Gemini 2.5 Flash · This platform does not constitute financial advice.
        </p>
      </footer>
    </div>
  );
}
