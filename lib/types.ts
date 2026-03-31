// lib/types.ts
// Central type definitions for the entire application

export interface StockMetrics {
  ticker: string;
  companyName: string;
  price: number;
  priceChange: number;
  priceChangePct: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  pegRatio: number | null;
  debtToEquity: number | null;
  freeCashFlow: number | null;
  revenueGrowthYoY: number | null;
  grossMargin: number | null;
  eps: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  timestamp: string;
}

export interface QuantFlag {
  metric: string;
  value: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  threshold: string;
  note: string;
}

export interface NewsItem {
  headline: string;
  source: string;
  publishedAt: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | null;
  url: string;
}

export interface TearSheetData {
  executiveSummary: string[];
  bullCase: string[];
  bearCase: string[];
  verdict: 'ACCUMULATE' | 'HOLD' | 'AVOID';
  verdictRationale: string;
  confidenceScore: number;
  generatedAt: string;
}

// Single OHLCV candle — one entry per trading day
export interface PriceCandle {
  date: string;        // formatted date string e.g. "Apr 15"
  timestamp: number;   // Unix ms timestamp for sorting
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Derived fields for chart coloring
  isGreen: boolean;    // close >= open
  change: number;      // close - open
  changePct: number;   // percentage change from open to close
}

export interface ResearchReport {
  metrics: StockMetrics;
  quantFlags: QuantFlag[];
  news: NewsItem[];
  tearSheet: TearSheetData | null;
  // Price history is optional — chart won't render if unavailable
  priceHistory: PriceCandle[];
  status: 'idle' | 'loading' | 'complete' | 'error';
  errorMessage?: string;
}
