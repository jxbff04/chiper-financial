// lib/analyzeWithGemini.ts
// Zero-Bias AI synthesis layer using Google Gemini 1.5 Flash
// Sends all quantitative data + news to Gemini and returns a structured TearSheet

import { GoogleGenerativeAI } from '@google/generative-ai';
import { StockMetrics, QuantFlag, NewsItem, TearSheetData } from './types';

export async function analyzeWithGemini(
  metrics: StockMetrics,
  quantFlags: QuantFlag[],
  news: NewsItem[]
): Promise<{ tearSheet: TearSheetData; newsWithSentiment: NewsItem[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in .env.local');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // ── Build the quantitative summary string ─────────────────────
  const quantSummary = quantFlags
    .map((f) => f.metric + ': ' + f.value + ' [' + f.status + '] — ' + f.note)
    .join('\n');

  // ── Build the headlines string ────────────────────────────────
  const headlinesList = news
    .map((n, i) => (i + 1) + '. ' + n.headline + ' (' + n.source + ')')
    .join('\n');

  // ── The Zero-Bias Institutional Prompt ───────────────────────
  // This prompt is engineered to:
  // 1. Prevent hallucination (only use the data provided)
  // 2. Enforce Devil's Advocate / Inversion mental models
  // 3. Return strict JSON so we can parse it reliably
  const prompt = `
You are a Zero-Bias Quantitative Research Analyst at a top-tier institutional hedge fund.
Your sole function is to analyze the provided financial data and output a structured research report.

CRITICAL OPERATING RULES — YOU MUST FOLLOW ALL OF THESE:
1. ZERO HALLUCINATION: You may ONLY reference facts explicitly present in the data below. Do not invent metrics, price targets, or analyst ratings.
2. ZERO OPTIMISM BIAS: You are not a cheerleader. Do not default to positive language. If data is weak, say it is weak.
3. DEVIL'S ADVOCATE: For every bullish signal, you must actively search for the corresponding risk. Invert every thesis.
4. DATA-DRIVEN ONLY: Every bullet point in your analysis must cite a specific number or flag from the data provided.
5. SENTIMENT CLASSIFICATION: Classify each headline as POSITIVE, NEGATIVE, or NEUTRAL based purely on factual content. Ignore the source's tone. Focus on: does this headline represent a material positive or negative change for the company's revenue, costs, legal standing, or competitive position?

---
COMPANY: ${metrics.ticker} — ${metrics.companyName}
PRICE: $${metrics.price.toFixed(2)} (${metrics.priceChangePct >= 0 ? '+' : ''}${metrics.priceChangePct.toFixed(2)}% today)
MARKET CAP: $${(metrics.marketCap / 1e9).toFixed(2)}B
52W RANGE: $${metrics.fiftyTwoWeekLow.toFixed(2)} — $${metrics.fiftyTwoWeekHigh.toFixed(2)}
EPS: ${metrics.eps !== null ? '$' + metrics.eps.toFixed(2) : 'N/A'}

QUANTITATIVE FLAGS:
${quantSummary}

NEWS HEADLINES (last 7 days):
${headlinesList}
---

OUTPUT INSTRUCTIONS:
Return ONLY a valid JSON object. No markdown, no backticks, no explanation outside the JSON.
The JSON must match this exact structure:

{
  "sentiments": [
    { "index": 1, "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL" },
    ... (one entry per headline, same order)
  ],
  "executiveSummary": [
    "First factual bullet — must include specific numbers from the data.",
    "Second factual bullet — must include specific numbers from the data."
  ],
  "bullCase": [
    "Bull point 1 — cite a specific metric.",
    "Bull point 2 — cite a specific metric.",
    "Bull point 3 — cite a specific metric."
  ],
  "bearCase": [
    "Bear point 1 — cite a specific risk or red flag. Prefix with CRITICAL: if it is a binary or existential risk.",
    "Bear point 2 — cite a specific risk.",
    "Bear point 3 — cite a specific risk.",
    "Bear point 4 — cite a specific risk."
  ],
  "verdict": "ACCUMULATE" | "HOLD" | "AVOID",
  "verdictRationale": "One paragraph of 2-3 sentences. Must be objective. Must acknowledge both upside and downside. Must not use words like 'exciting', 'great', 'amazing', or any other promotional language."
}

VERDICT DECISION RULES:
- ACCUMULATE: Majority of quant flags are PASS, sentiment skews positive, valuation is not extreme.
- HOLD: Mixed signals — some strong metrics offset by material risks. Existing positions defensible, new positions require caution.
- AVOID: Multiple FAIL flags, negative FCF, extreme valuation with no growth support, OR a single CRITICAL binary risk present.
`;

  // ── Call Gemini API ───────────────────────────────────────────
  const result = await model.generateContent(prompt);
  const rawText = result.response.text().trim();

  // ── Parse the JSON response ───────────────────────────────────
  // Strip any accidental markdown fences Gemini might add despite instructions
  const cleanJson = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: {
    sentiments: { index: number; sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' }[];
    executiveSummary: string[];
    bullCase: string[];
    bearCase: string[];
    verdict: 'ACCUMULATE' | 'HOLD' | 'AVOID';
    verdictRationale: string;
  };

  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    throw new Error(
      'Gemini returned malformed JSON. Raw response: ' + rawText.slice(0, 300)
    );
  }

  // ── Apply sentiment labels back to the news items ─────────────
  const newsWithSentiment: NewsItem[] = news.map((item, i) => {
    const sentimentEntry = parsed.sentiments.find((s) => s.index === i + 1);
    return {
      ...item,
      sentiment: sentimentEntry ? sentimentEntry.sentiment : 'NEUTRAL',
    };
  });

  // ── Calculate confidence score based on data availability ─────
  // Counts how many key metrics are NOT null — gives a 0-100 score
  const dataPoints = [
    metrics.peRatio,
    metrics.pegRatio,
    metrics.debtToEquity,
    metrics.freeCashFlow,
    metrics.revenueGrowthYoY,
    metrics.grossMargin,
    metrics.eps,
  ];
  const availablePoints = dataPoints.filter((v) => v !== null).length;
  const confidenceScore = Math.round((availablePoints / dataPoints.length) * 100);

  // ── Assemble the final TearSheet ──────────────────────────────
  const tearSheet: TearSheetData = {
    executiveSummary: parsed.executiveSummary.slice(0, 2),
    bullCase: parsed.bullCase,
    bearCase: parsed.bearCase,
    verdict: parsed.verdict,
    verdictRationale: parsed.verdictRationale,
    confidenceScore,
    generatedAt: new Date().toISOString(),
  };

  return { tearSheet, newsWithSentiment };
}
