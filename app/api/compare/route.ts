// app/api/compare/route.ts
// Batch fetch metrics for 2-3 tickers and run AI comparison synthesis
// POST /api/compare { tickers: ["NVDA", "AMD", "INTC"] }

import { NextRequest, NextResponse } from 'next/server';
import { fetchStockData } from '@/lib/fetchStockData';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { StockMetrics } from '@/lib/types';

// Build a compact data summary string for the AI prompt
function buildMetricsSummary(m: StockMetrics): string {
  return [
    m.ticker + ' (' + m.companyName + ')',
    '  Price: $' + m.price.toFixed(2) + ' (' + (m.priceChangePct >= 0 ? '+' : '') + m.priceChangePct.toFixed(2) + '% today)',
    '  Market Cap: $' + (m.marketCap / 1e9).toFixed(2) + 'B',
    '  P/E: ' + (m.peRatio ? m.peRatio.toFixed(1) + 'x' : 'N/A'),
    '  PEG: ' + (m.pegRatio ? m.pegRatio.toFixed(2) : 'N/A'),
    '  Revenue Growth YoY: ' + (m.revenueGrowthYoY !== null ? m.revenueGrowthYoY + '%' : 'N/A'),
    '  Gross Margin: ' + (m.grossMargin !== null ? m.grossMargin + '%' : 'N/A'),
    '  Debt/Equity: ' + (m.debtToEquity !== null ? m.debtToEquity.toFixed(2) : 'N/A'),
    '  Free Cash Flow: ' + (m.freeCashFlow !== null ? '$' + m.freeCashFlow.toLocaleString() + 'M' : 'N/A'),
    '  EPS: ' + (m.eps !== null ? '$' + m.eps.toFixed(2) : 'N/A'),
    '  52W Range: $' + m.fiftyTwoWeekLow.toFixed(2) + ' - $' + m.fiftyTwoWeekHigh.toFixed(2),
    '  vs 52W High: ' + (((m.price - m.fiftyTwoWeekHigh) / m.fiftyTwoWeekHigh) * 100).toFixed(1) + '%',
  ].join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTickers: string[] = body.tickers ?? [];

    // Validate: 2-3 tickers, no duplicates, valid format
    const tickers = [...new Set(
      rawTickers.map((t: string) => t.trim().toUpperCase()).filter((t: string) => t.length > 0 && t.length <= 10)
    )];

    if (tickers.length < 2) {
      return NextResponse.json(
        { error: 'Please provide at least 2 valid ticker symbols to compare.' },
        { status: 400 }
      );
    }

    if (tickers.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 tickers can be compared at once.' },
        { status: 400 }
      );
    }

    console.log('[Compare Pipeline] Fetching data for:', tickers.join(', '));

    // Fetch all tickers in parallel — use allSettled so one failure
    // does not abort the others
    const results = await Promise.allSettled(
      tickers.map((ticker) => fetchStockData(ticker))
    );

    // Collect successful fetches and report any failures
    const stocks: StockMetrics[] = [];
    const errors: string[] = [];

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        stocks.push(result.value);
      } else {
        errors.push(tickers[i] + ': ' + (result.reason?.message ?? 'Unknown error'));
      }
    });

    // Need at least 2 successful fetches to compare
    if (stocks.length < 2) {
      return NextResponse.json(
        { error: 'Could not fetch data for enough tickers. ' + errors.join('; ') },
        { status: 500 }
      );
    }

    console.log('[Compare Pipeline] Data fetched. Running AI comparison...');

    // ── Gemini AI Comparison Prompt ───────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env.local');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const metricsSummaries = stocks.map(buildMetricsSummary).join('\n\n');

    const prompt = `
You are a Zero-Bias Quantitative Research Analyst at a top-tier institutional hedge fund.
Your task is to compare the following stocks using ONLY the data provided.

CRITICAL RULES:
1. ZERO HALLUCINATION: Only reference numbers explicitly in the data below.
2. ZERO BIAS: Do not favor any stock. Let the numbers speak.
3. DEVIL'S ADVOCATE: For the stock you rank #1, state its biggest risk. For the stock you rank last, state if there is a contrarian case.
4. Every claim must cite a specific metric from the data.

---
STOCKS TO COMPARE:
${metricsSummaries}
---

Return ONLY valid JSON. No markdown, no backticks, no explanation outside JSON.

{
  "rankedTickers": ["TICKER1", "TICKER2", "TICKER3"],
  "rankingRationale": "2-3 sentences explaining the ranking based purely on the numbers.",
  "perStock": {
    "TICKER": {
      "strongestMetric": "The single most impressive metric for this stock and its value.",
      "weakestMetric": "The single most concerning metric for this stock and its value.",
      "oneLineSummary": "One sentence, data-driven, no promotional language."
    }
  },
  "keyInsight": "One paragraph. The most important non-obvious finding from comparing these stocks side by side. Must cite at least 2 specific numbers.",
  "warningFlags": ["Any data point that is anomalous or potentially misleading across the comparison. List 1-3 flags."]
}
`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Strip markdown fences if Gemini adds them despite instructions
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(cleanJson);
    } catch {
      throw new Error('Gemini returned malformed JSON: ' + rawText.slice(0, 200));
    }

    console.log('[Compare Pipeline] Complete. Ranked:', aiAnalysis.rankedTickers?.join(' > '));

    return NextResponse.json({
      stocks,
      aiAnalysis,
      fetchErrors: errors.length > 0 ? errors : undefined,
      status: 'complete',
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred.';
    console.error('[Compare Pipeline] Error:', message);
    return NextResponse.json({ error: message, status: 'error' }, { status: 500 });
  }
}
