// lib/fetchNews.ts
// Fetches the latest 10 news headlines for a ticker from Finnhub
// Requires FINNHUB_API_KEY in .env.local

import { NewsItem } from './types';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

export async function fetchNews(ticker: string): Promise<NewsItem[]> {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    throw new Error('FINNHUB_API_KEY is not set in .env.local');
  }

  // Finnhub requires a date range — we fetch the last 7 days
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  const fromDate = weekAgo.toISOString().split('T')[0];  // format: YYYY-MM-DD
  const toDate = today.toISOString().split('T')[0];

  const url =
    FINNHUB_BASE +
    '/company-news' +
    '?symbol=' + ticker.toUpperCase() +
    '&from=' + fromDate +
    '&to=' + toDate +
    '&token=' + apiKey;

  const response = await fetch(url, {
    // No-store ensures we always get fresh news, not a cached response
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      'Finnhub API error: ' + response.status + ' ' + response.statusText
    );
  }

  const data = await response.json();

  // Finnhub returns an array — if empty, return a placeholder
  if (!Array.isArray(data) || data.length === 0) {
    return [
      {
        headline: 'No recent news found for ' + ticker.toUpperCase() + ' in the last 7 days.',
        source: 'System',
        publishedAt: new Date().toISOString(),
        sentiment: 'NEUTRAL',
        url: '#',
      },
    ];
  }

  // Take the 10 most recent articles and map to our NewsItem type
  // sentiment starts as null — it will be filled by the AI layer
  const newsItems: NewsItem[] = data
    .slice(0, 10)
    .map((article: {
      headline?: string;
      source?: string;
      datetime?: number;
      url?: string;
    }) => ({
      headline: article.headline ?? 'No headline available',
      source: article.source ?? 'Unknown',
      // Finnhub returns Unix timestamp (seconds) — convert to ISO string
      publishedAt: article.datetime
        ? new Date(article.datetime * 1000).toISOString()
        : new Date().toISOString(),
      sentiment: null, // will be assigned by Gemini AI layer
      url: article.url ?? '#',
    }));

  return newsItems;
}
