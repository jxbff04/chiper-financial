// lib/fetchPriceHistory.ts
// Fetches 30-day OHLCV candlestick data from Alpha Vantage
// Requires ALPHA_VANTAGE_API_KEY in .env.local
// Endpoint: TIME_SERIES_DAILY — free tier, no restrictions for US stocks

import { PriceCandle } from './types';

const AV_BASE = 'https://www.alphavantage.co/query';

// Format a date string "YYYY-MM-DD" to a short label e.g. "Apr 15"
function formatDateLabel(dateStr: string): string {
  // Append T00:00:00 to prevent timezone shift when parsing
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export async function fetchPriceHistory(ticker: string): Promise<PriceCandle[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY is not set in .env.local');
  }

  const url =
    AV_BASE +
    '?function=TIME_SERIES_DAILY' +
    '&symbol=' + ticker.toUpperCase() +
    '&outputsize=compact' + // compact = last 100 trading days, enough for 30
    '&apikey=' + apiKey;

  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error('Alpha Vantage API error: ' + res.status);
  }

  const data = await res.json();

  // Alpha Vantage returns an error note in the JSON body (not HTTP status)
  if (data['Note']) {
    throw new Error('Alpha Vantage rate limit hit. Wait 1 minute and try again.');
  }

  if (data['Error Message']) {
    throw new Error('Alpha Vantage: ' + data['Error Message']);
  }

  const timeSeries = data['Time Series (Daily)'];
  if (!timeSeries) {
    return [];
  }

  // timeSeries is an object keyed by "YYYY-MM-DD" strings
  // Sort descending (newest first), take 30 days, then reverse for chart
  const entries = Object.entries(timeSeries) as [
    string,
    { '1. open': string; '2. high': string; '3. low': string; '4. close': string; '5. volume': string }
  ][];

  const candles: PriceCandle[] = entries
    .slice(0, 30) // take 30 most recent trading days
    .map(([dateStr, values]) => {
      const open = parseFloat(values['1. open']);
      const high = parseFloat(values['2. high']);
      const low = parseFloat(values['3. low']);
      const close = parseFloat(values['4. close']);
      const volume = parseInt(values['5. volume'], 10);
      const change = parseFloat((close - open).toFixed(2));
      const changePct =
        open > 0 ? parseFloat(((change / open) * 100).toFixed(2)) : 0;

      return {
        date: formatDateLabel(dateStr),
        timestamp: new Date(dateStr + 'T00:00:00').getTime(),
        open,
        high,
        low,
        close,
        volume,
        isGreen: close >= open,
        change,
        changePct,
      };
    })
    // Sort ascending (oldest first) so chart renders left-to-right correctly
    .sort((a, b) => a.timestamp - b.timestamp);

  return candles;
}
