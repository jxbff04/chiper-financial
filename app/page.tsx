// app/page.tsx
// Main dashboard — now includes PriceChart between KPI cards and Quant/Sentiment panels

'use client';

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import TickerInput from '@/components/TickerInput';
import MetricCard from '@/components/MetricCard';
import QuantCard from '@/components/QuantCard';
import SentimentPanel from '@/components/SentimentPanel';
import TearSheet from '@/components/TearSheet';
import PriceChart from '@/components/PriceChart';
import { ResearchReport } from '@/lib/types';
import { Activity, AlertTriangle, Search } from 'lucide-react';

function formatMarketCap(n: number): string {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString();
}

function formatVolume(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  return n.toLocaleString();
}

function IdleState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Search size={40} className="text-muted-foreground opacity-30" />
      <p className="text-sm text-muted-foreground">
        Enter a ticker symbol above to run the institutional research pipeline.
      </p>
      <p className="text-[11px] text-muted-foreground opacity-60">
        Examples: AAPL · NVDA · MSFT · TSLA · AMZN · META
      </p>
    </div>
  );
}

function LoadingState({ ticker }: { ticker: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
        <span className="text-sm text-emerald-400 font-bold tracking-widest uppercase">
          Analyzing {ticker}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground space-y-1 text-center">
        <p>Fetching market data from Finnhub...</p>
        <p>Pulling 30-day price history...</p>
        <p>Retrieving latest news headlines...</p>
        <p>Running quantitative screening...</p>
        <p>Synthesizing Zero-Bias AI report via Gemini...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <AlertTriangle size={32} className="text-red-400" />
      <p className="text-sm text-red-400 font-bold">Pipeline Error</p>
      <p className="text-xs text-muted-foreground max-w-md text-center">{message}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTicker, setCurrentTicker] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSearch(ticker: string) {
    setIsLoading(true);
    setErrorMessage('');
    setCurrentTicker(ticker);
    setReport(null);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.error ?? 'Unknown error from research pipeline.');
      }

      setReport(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  const renderContent = () => {
    if (isLoading) return <LoadingState ticker={currentTicker} />;
    if (errorMessage) return <ErrorState message={errorMessage} />;
    if (!report) return <IdleState />;

    const m = report.metrics;
    const isPositive = m.priceChange >= 0;

    return (
      <>
        {/* ── Company Header ── */}
        <section className="flex items-baseline gap-4 flex-wrap">
          <div>
            <span className="text-3xl font-black tracking-tight text-foreground">
              {m.ticker}
            </span>
            <span className="text-sm text-muted-foreground ml-3">
              {m.companyName}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              ${m.price.toFixed(2)}
            </span>
            <span className={'text-sm font-bold ' + (isPositive ? 'text-emerald-400' : 'text-red-400')}>
              {isPositive ? '+' : ''}{m.priceChange.toFixed(2)} ({isPositive ? '+' : ''}{m.priceChangePct.toFixed(2)}%)
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground ml-auto">
            Last updated: {new Date(m.timestamp).toLocaleTimeString()}
          </span>
        </section>

        <Separator className="bg-border" />

        {/* ── KPI Metric Cards ── */}
        <section>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Key Metrics
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <MetricCard label="Market Cap" value={formatMarketCap(m.marketCap)} />
            <MetricCard
              label="Volume"
              value={formatVolume(m.volume)}
              subValue={'Avg: ' + formatVolume(m.avgVolume)}
            />
            <MetricCard
              label="P/E Ratio"
              value={m.peRatio ? m.peRatio.toFixed(1) + 'x' : 'N/A'}
              highlight={!!m.peRatio && m.peRatio > 25}
            />
            <MetricCard
              label="PEG Ratio"
              value={m.pegRatio ? m.pegRatio.toFixed(2) : 'N/A'}
            />
            <MetricCard
              label="Debt / Equity"
              value={m.debtToEquity ? m.debtToEquity.toFixed(2) : 'N/A'}
            />
            <MetricCard
              label="Free Cash Flow"
              value={m.freeCashFlow ? '$' + m.freeCashFlow.toLocaleString() + 'M' : 'N/A'}
              highlight
            />
            <MetricCard
              label="Rev Growth YoY"
              value={
                m.revenueGrowthYoY !== null
                  ? (m.revenueGrowthYoY >= 0 ? '+' : '') + m.revenueGrowthYoY + '%'
                  : 'N/A'
              }
              subValueColor={
                m.revenueGrowthYoY !== null && m.revenueGrowthYoY >= 0 ? 'green' : 'red'
              }
            />
            <MetricCard
              label="Gross Margin"
              value={m.grossMargin !== null ? m.grossMargin + '%' : 'N/A'}
            />
            <MetricCard
              label="EPS"
              value={m.eps !== null ? '$' + m.eps.toFixed(2) : 'N/A'}
            />
            <MetricCard label="52W High" value={'$' + m.fiftyTwoWeekHigh.toFixed(2)} />
            <MetricCard label="52W Low" value={'$' + m.fiftyTwoWeekLow.toFixed(2)} />
            <MetricCard
              label="vs 52W High"
              value={
                (((m.price - m.fiftyTwoWeekHigh) / m.fiftyTwoWeekHigh) * 100).toFixed(1) + '%'
              }
              subValueColor="red"
            />
          </div>
        </section>

        {/* ── Price Chart ── */}
        <section>
          <PriceChart
            candles={report.priceHistory}
            ticker={m.ticker}
            currentPrice={m.price}
          />
        </section>

        {/* ── Quant Flags + News Sentiment ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <QuantCard flags={report.quantFlags} />
          <SentimentPanel news={report.news} />
        </section>

        {/* ── AI Tear Sheet ── */}
        {report.tearSheet && (
          <section>
            <TearSheet data={report.tearSheet} />
          </section>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-400" />
          <span className="text-sm font-bold tracking-widest uppercase text-foreground">
            Institutional Research Terminal
          </span>
          <span className="text-[10px] text-muted-foreground ml-2 border border-border px-1.5 py-0.5 rounded">
            BETA
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">
          ZERO-BIAS ENGINE v1.0 · NOT FINANCIAL ADVICE
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section>
          <TickerInput onSearch={handleSearch} isLoading={isLoading} />
        </section>
        {renderContent()}
      </main>
    </div>
  );
}
