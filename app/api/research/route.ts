// app/api/research/route.ts
// Master orchestration endpoint for the full research pipeline
// POST /api/research { ticker: "NVDA" }

import { NextRequest, NextResponse } from 'next/server';
import { fetchStockData } from '@/lib/fetchStockData';
import { fetchNews } from '@/lib/fetchNews';
import { fetchPriceHistory } from '@/lib/fetchPriceHistory';
import { runQuantChecks } from '@/lib/runQuantChecks';
import { analyzeWithGemini } from '@/lib/analyzeWithGemini';
import { ResearchReport } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ticker = (body.ticker ?? '').trim().toUpperCase();

    if (!ticker || ticker.length > 10) {
      return NextResponse.json(
        { error: 'Invalid ticker symbol provided.' },
        { status: 400 }
      );
    }

    console.log('[Research Pipeline] Starting for ticker:', ticker);

    // Fetch stock data, news, and price history in parallel
    // priceHistory uses Promise.allSettled so a Finnhub candle error
    // does not crash the entire pipeline
    const [metricsResult, newsResult, historyResult] = await Promise.allSettled([
      fetchStockData(ticker),
      fetchNews(ticker),
      fetchPriceHistory(ticker),
    ]);

    // Stock data is required — if it fails, abort the pipeline
    if (metricsResult.status === 'rejected') {
      throw new Error(metricsResult.reason?.message ?? 'Failed to fetch stock data.');
    }

    // News is required for AI analysis — if it fails, abort
    if (newsResult.status === 'rejected') {
      throw new Error(newsResult.reason?.message ?? 'Failed to fetch news.');
    }

    const metrics = metricsResult.value;
    const rawNews = newsResult.value;

    // Price history is optional — degrade gracefully if unavailable
    const priceHistory =
      historyResult.status === 'fulfilled' ? historyResult.value : [];

    if (historyResult.status === 'rejected') {
      console.warn('[Research Pipeline] Price history unavailable:', historyResult.reason?.message);
    }

    console.log('[Research Pipeline] Data fetched. Running quant checks...');
    const quantFlags = runQuantChecks(metrics);

    console.log('[Research Pipeline] Calling Gemini...');
    const { tearSheet, newsWithSentiment } = await analyzeWithGemini(
      metrics,
      quantFlags,
      rawNews
    );

    console.log('[Research Pipeline] Complete. Verdict:', tearSheet.verdict);

    const report: ResearchReport = {
      metrics,
      quantFlags,
      news: newsWithSentiment,
      tearSheet,
      priceHistory,
      status: 'complete',
    };

    return NextResponse.json(report, { status: 200 });

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('[Research Pipeline] Error:', message);
    return NextResponse.json({ error: message, status: 'error' }, { status: 500 });
  }
}
