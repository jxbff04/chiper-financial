// lib/runQuantChecks.ts
// Pure quantitative screening engine — no API calls needed
// Compares stock metrics against institutional-grade thresholds
// and returns a list of PASS / WARN / FAIL flags

import { StockMetrics, QuantFlag } from './types';

// Helper: returns PASS, WARN, or FAIL based on a numeric value and thresholds
function grade(
  value: number | null,
  passIf: (v: number) => boolean,
  warnIf: (v: number) => boolean
): 'PASS' | 'WARN' | 'FAIL' {
  if (value === null) return 'WARN'; // missing data is always a warning
  if (passIf(value)) return 'PASS';
  if (warnIf(value)) return 'WARN';
  return 'FAIL';
}

export function runQuantChecks(m: StockMetrics): QuantFlag[] {
  const flags: QuantFlag[] = [];

  // ── 1. P/E Ratio ──────────────────────────────────────────────
  // Under 25x = pass, 25-40x = warn (expensive), over 40x = fail (speculative)
  flags.push({
    metric: 'P/E Ratio',
    value: m.peRatio !== null ? m.peRatio.toFixed(1) + 'x' : 'N/A',
    status: grade(
      m.peRatio,
      (v) => v > 0 && v <= 25,
      (v) => v > 0 && v <= 40
    ),
    threshold: '< 25x',
    note:
      m.peRatio === null
        ? 'No P/E data — company may be unprofitable.'
        : m.peRatio <= 25
        ? 'Valuation is within reasonable range.'
        : m.peRatio <= 40
        ? 'Premium valuation — requires strong growth to justify.'
        : 'Elevated valuation — leaves no margin of safety.',
  });

  // ── 2. PEG Ratio ──────────────────────────────────────────────
  // Under 1.0 = potentially undervalued, 1.0-2.0 = fair, over 2.0 = expensive
  flags.push({
    metric: 'PEG Ratio',
    value: m.pegRatio !== null ? m.pegRatio.toFixed(2) : 'N/A',
    status: grade(
      m.pegRatio,
      (v) => v > 0 && v <= 1.5,
      (v) => v > 0 && v <= 2.5
    ),
    threshold: '< 2.0',
    note:
      m.pegRatio === null
        ? 'PEG unavailable — cannot assess growth-adjusted valuation.'
        : m.pegRatio <= 1.0
        ? 'Growth-adjusted valuation is attractive.'
        : m.pegRatio <= 2.0
        ? 'Growth-adjusted valuation is acceptable.'
        : 'Market is pricing in very high future growth.',
  });

  // ── 3. Debt / Equity ──────────────────────────────────────────
  // Under 1.0 = conservative, 1.0-2.0 = moderate, over 2.0 = leveraged
  flags.push({
    metric: 'Debt / Equity',
    value: m.debtToEquity !== null ? m.debtToEquity.toFixed(2) : 'N/A',
    status: grade(
      m.debtToEquity,
      (v) => v >= 0 && v <= 1.0,
      (v) => v > 0 && v <= 2.0
    ),
    threshold: '< 1.0',
    note:
      m.debtToEquity === null
        ? 'Debt/Equity data unavailable.'
        : m.debtToEquity <= 1.0
        ? 'Balance sheet leverage is conservative.'
        : m.debtToEquity <= 2.0
        ? 'Moderate leverage — monitor interest coverage.'
        : 'High leverage — vulnerable to rate increases and revenue shocks.',
  });

  // ── 4. Free Cash Flow ─────────────────────────────────────────
  // Positive FCF = pass, negative = fail (burning cash)
  flags.push({
    metric: 'Free Cash Flow',
    value:
      m.freeCashFlow !== null
        ? '$' + Math.abs(m.freeCashFlow).toLocaleString() + 'M' + (m.freeCashFlow < 0 ? ' (neg)' : '')
        : 'N/A',
    status: grade(
      m.freeCashFlow,
      (v) => v > 0,
      (v) => v === 0
    ),
    threshold: '> $0',
    note:
      m.freeCashFlow === null
        ? 'FCF data unavailable.'
        : m.freeCashFlow > 0
        ? 'Positive FCF — company generates real cash.'
        : 'Negative FCF — company is burning cash. High risk.',
  });

  // ── 5. Revenue Growth YoY ─────────────────────────────────────
  // Over 15% = strong, 0-15% = moderate, negative = declining
  flags.push({
    metric: 'Revenue Growth YoY',
    value: m.revenueGrowthYoY !== null ? m.revenueGrowthYoY.toFixed(1) + '%' : 'N/A',
    status: grade(
      m.revenueGrowthYoY,
      (v) => v >= 15,
      (v) => v >= 0
    ),
    threshold: '> 10%',
    note:
      m.revenueGrowthYoY === null
        ? 'Revenue growth data unavailable.'
        : m.revenueGrowthYoY >= 15
        ? 'Strong revenue growth trajectory.'
        : m.revenueGrowthYoY >= 0
        ? 'Slow but positive revenue growth — monitor trend.'
        : 'Revenue is shrinking — fundamental red flag.',
  });

  // ── 6. Gross Margin ───────────────────────────────────────────
  // Over 40% = strong pricing power, 20-40% = average, under 20% = commodity
  flags.push({
    metric: 'Gross Margin',
    value: m.grossMargin !== null ? m.grossMargin.toFixed(1) + '%' : 'N/A',
    status: grade(
      m.grossMargin,
      (v) => v >= 40,
      (v) => v >= 20
    ),
    threshold: '> 40%',
    note:
      m.grossMargin === null
        ? 'Gross margin data unavailable.'
        : m.grossMargin >= 40
        ? 'Strong gross margin indicates pricing power.'
        : m.grossMargin >= 20
        ? 'Average margin — competitive pressure likely.'
        : 'Low gross margin — commodity-like business, vulnerable to cost shocks.',
  });

  // ── 7. Price vs 52-Week High ──────────────────────────────────
  // Within 10% of high = near peak, 10-25% below = pullback, over 25% = downtrend
  const vsHigh =
    m.fiftyTwoWeekHigh > 0
      ? ((m.price - m.fiftyTwoWeekHigh) / m.fiftyTwoWeekHigh) * 100
      : null;

  flags.push({
    metric: 'Price vs 52W High',
    value: vsHigh !== null ? vsHigh.toFixed(1) + '%' : 'N/A',
    status: grade(
      vsHigh,
      (v) => v >= -10,        // within 10% of high = strong momentum
      (v) => v >= -25         // 10-25% below = caution
    ),
    threshold: '> -15%',
    note:
      vsHigh === null
        ? '52-week high data unavailable.'
        : vsHigh >= -10
        ? 'Trading near 52-week high — strong momentum.'
        : vsHigh >= -25
        ? 'Notable pullback from peak — trend reversal unconfirmed.'
        : 'Significant drawdown — potential downtrend in progress.',
  });

  // ── 8. Volume vs Average ──────────────────────────────────────
  // 20% above average = unusual activity (can be bullish or bearish)
  const volRatio =
    m.avgVolume > 0 ? (m.volume / m.avgVolume) * 100 - 100 : null;

  flags.push({
    metric: 'Volume vs Avg',
    value: volRatio !== null ? (volRatio >= 0 ? '+' : '') + volRatio.toFixed(0) + '%' : 'N/A',
    status: grade(
      volRatio,
      (v) => Math.abs(v) <= 20,   // normal volume range
      (v) => Math.abs(v) <= 50    // moderately elevated
    ),
    threshold: 'Within +/-20%',
    note:
      volRatio === null
        ? 'Volume data unavailable.'
        : Math.abs(volRatio) <= 20
        ? 'Volume within normal range — no unusual activity.'
        : Math.abs(volRatio) <= 50
        ? 'Elevated volume — increased market interest or distribution.'
        : 'Extreme volume deviation — potential news catalyst or institutional movement.',
  });

  return flags;
}
