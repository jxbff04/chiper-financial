// lib/fetchStockData.ts
// Fetches real-time stock metrics from Finnhub API
// Requires FINNHUB_API_KEY in .env.local
// Uses two endpoints: /quote (price data) + /stock/metric (fundamentals)

import { StockMetrics } from './types';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// Helper: fetch with Finnhub auth token appended
async function finnhubGet(path: string, apiKey: string) {
  const url = FINNHUB_BASE + path + (path.includes('?') ? '&' : '?') + 'token=' + apiKey;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Finnhub API error ' + res.status + ' on ' + path);
  }
  return res.json();
}

export async function fetchStockData(ticker: string): Promise<StockMetrics> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error('FINNHUB_API_KEY is not set in .env.local');
  }

  const symbol = ticker.toUpperCase();

  // Run all three requests in parallel to minimize latency
  // /quote          -> real-time price, change, volume
  // /stock/metric   -> PE, EPS, 52w high/low, margins, growth
  // /stock/profile2 -> company name, market cap
  const [quote, metrics, profile] = await Promise.all([
    finnhubGet('/quote?symbol=' + symbol, apiKey),
    finnhubGet('/stock/metric?symbol=' + symbol + '&metric=all', apiKey),
    finnhubGet('/stock/profile2?symbol=' + symbol, apiKey),
  ]);

  // Guard: if Finnhub returns c=0 with no data, ticker is invalid
  if (!quote || quote.c === 0) {
    throw new Error(
      'Ticker "' + symbol + '" not found or market data unavailable. Please check the symbol.'
    );
  }

  // Finnhub stores fundamentals under metrics.metric (nested object)
  const m = metrics?.metric ?? {};

  // Price change calculation from Finnhub quote
  // c = current price, pc = previous close
  const currentPrice: number = quote.c ?? 0;
  const prevClose: number = quote.pc ?? 0;
  const priceChange = parseFloat((currentPrice - prevClose).toFixed(2));
  const priceChangePct = prevClose > 0
    ? parseFloat(((priceChange / prevClose) * 100).toFixed(2))
    : 0;

  const stockMetrics: StockMetrics = {
    ticker: symbol,
    companyName: profile?.name ?? symbol,
    price: currentPrice,
    priceChange,
    priceChangePct,

    // Finnhub quote: v = current volume (may be 0 outside market hours)
    volume: quote.v ?? 0,
    avgVolume: m['10DayAverageTradingVolume']
      ? Math.round(m['10DayAverageTradingVolume'] * 1_000_000)
      : 0,

    // Market cap from profile (in millions) -- convert to raw number
    marketCap: profile?.marketCapitalization
      ? profile.marketCapitalization * 1_000_000
      : 0,

    // Valuation
    peRatio: m['peNormalizedAnnual'] ?? m['peTTM'] ?? null,
    pegRatio: m['priceEarningsToGrowthRatioAnnual'] ?? null,

    // Balance sheet
    debtToEquity: m['totalDebt/totalEquityAnnual'] ?? null,

    // Cash flow (Finnhub returns in millions already)
    freeCashFlow: m['freeCashFlowAnnual'] ?? null,

    // Growth & profitability
    revenueGrowthYoY: m['revenueGrowthTTMYoy'] != null
      ? parseFloat((m['revenueGrowthTTMYoy']).toFixed(1))
      : null,

    grossMargin: m['grossMarginTTM'] != null
      ? parseFloat((m['grossMarginTTM']).toFixed(1))
      : null,

    eps: m['epsNormalizedAnnual'] ?? m['epsTTM'] ?? null,

    // 52-week range
    fiftyTwoWeekHigh: m['52WeekHigh'] ?? currentPrice,
    fiftyTwoWeekLow: m['52WeekLow'] ?? currentPrice,

    timestamp: new Date().toISOString(),
  };

  return stockMetrics;
}
