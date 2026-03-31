// lib/fetchPriceHistory.ts
// Fetches 30-day OHLCV (candlestick) data from Finnhub
// Requires FINNHUB_API_KEY in .env.local

import { PriceCandle } from './types';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// Format a Unix timestamp to a short date label e.g. "Apr 15"
function formatDateLabel(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export async function fetchPriceHistory(ticker: string): Promise<PriceCandle[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error('FINNHUB_API_KEY is not set in .env.local');
  }

  // Calculate Unix timestamps for 30 days ago and today
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

  // Finnhub /stock/candle returns OHLCV arrays indexed by position
  // resolution=D means daily candles
  const url =
    FINNHUB_BASE +
    '/stock/candle' +
    '?symbol=' + ticker.toUpperCase() +
    '&resolution=D' +
    '&from=' + thirtyDaysAgo +
    '&to=' + now +
    '&token=' + apiKey;

  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error('Finnhub candle API error: ' + res.status);
  }

  const data = await res.json();

  // Finnhub returns { s: "ok"|"no_data", t: [], o: [], h: [], l: [], c: [], v: [] }
  if (!data || data.s !== 'ok' || !Array.isArray(data.t)) {
    // Return empty array gracefully — chart will show "no data" state
    return [];
  }

  // Map parallel arrays into PriceCandle objects
  const candles: PriceCandle[] = data.t.map((timestamp: number, i: number) => {
    const open: number = data.o[i];
    const close: number = data.c[i];
    const change = parseFloat((close - open).toFixed(2));
    const changePct = open > 0
      ? parseFloat(((change / open) * 100).toFixed(2))
      : 0;

    return {
      date: formatDateLabel(timestamp),
      timestamp: timestamp * 1000, // convert to ms for JS Date
      open,
      high: data.h[i],
      low: data.l[i],
      close,
      volume: data.v[i],
      isGreen: close >= open,
      change,
      changePct,
    };
  });

  // Sort ascending by date (oldest first) for correct chart rendering
  return candles.sort((a, b) => a.timestamp - b.timestamp);
}
