// components/ComparisonRadar.tsx
// Radar chart comparing stocks across 5 institutional dimensions
// Uses Recharts RadarChart

'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockMetrics } from '@/lib/types';

interface ComparisonRadarProps {
  stocks: StockMetrics[];
}

// Normalize a value to 0-100 scale given a min and max
function normalize(value: number | null, min: number, max: number): number {
  if (value === null) return 0;
  if (max === min) return 50;
  return Math.round(((value - min) / (max - min)) * 100);
}

// Invert a normalized score (for metrics where lower = better)
function invert(score: number): number {
  return 100 - score;
}

// Radar dimensions and how to score each stock on them
const DIMENSIONS = [
  {
    label: 'Valuation',
    // Lower PE + lower PEG = better valuation score
    score: (m: StockMetrics, all: StockMetrics[]) => {
      const pes = all.map((s) => s.peRatio ?? 999);
      const peScore = invert(normalize(m.peRatio ?? 999, Math.min(...pes), Math.max(...pes)));
      const pegs = all.map((s) => s.pegRatio ?? 999);
      const pegScore = invert(normalize(m.pegRatio ?? 999, Math.min(...pegs), Math.max(...pegs)));
      return Math.round((peScore + pegScore) / 2);
    },
  },
  {
    label: 'Growth',
    // Higher revenue growth = better growth score
    score: (m: StockMetrics, all: StockMetrics[]) => {
      const vals = all.map((s) => s.revenueGrowthYoY ?? -999);
      return normalize(m.revenueGrowthYoY ?? -999, Math.min(...vals), Math.max(...vals));
    },
  },
  {
    label: 'Profitability',
    // Higher gross margin = better profitability
    score: (m: StockMetrics, all: StockMetrics[]) => {
      const vals = all.map((s) => s.grossMargin ?? 0);
      return normalize(m.grossMargin ?? 0, Math.min(...vals), Math.max(...vals));
    },
  },
  {
    label: 'Safety',
    // Lower debt/equity = safer balance sheet
    score: (m: StockMetrics, all: StockMetrics[]) => {
      const vals = all.map((s) => s.debtToEquity ?? 999);
      return invert(normalize(m.debtToEquity ?? 999, Math.min(...vals), Math.max(...vals)));
    },
  },
  {
    label: 'Cash Flow',
    // Higher free cash flow = better
    score: (m: StockMetrics, all: StockMetrics[]) => {
      const vals = all.map((s) => s.freeCashFlow ?? -999);
      return normalize(m.freeCashFlow ?? -999, Math.min(...vals), Math.max(...vals));
    },
  },
  {
    label: 'Momentum',
    // Closer to 52W high = stronger momentum
    score: (m: StockMetrics, all: StockMetrics[]) => {
      const getMomentum = (s: StockMetrics) =>
        s.fiftyTwoWeekHigh > 0
          ? ((s.price - s.fiftyTwoWeekHigh) / s.fiftyTwoWeekHigh) * 100
          : -100;
      const vals = all.map(getMomentum);
      return normalize(getMomentum(m), Math.min(...vals), Math.max(...vals));
    },
  },
];

// One color per ticker
const COLORS = ['#34d399', '#60a5fa', '#c084fc']; // emerald, blue, purple

export default function ComparisonRadar({ stocks }: ComparisonRadarProps) {
  if (!stocks || stocks.length === 0) return null;

  // Build radar data: one object per dimension with a score per ticker
  const radarData = DIMENSIONS.map((dim) => {
    const entry: Record<string, string | number> = { dimension: dim.label };
    stocks.forEach((stock) => {
      entry[stock.ticker] = dim.score(stock, stocks);
    });
    return entry;
  });

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Multi-Dimensional Scoring (0–100 relative scale)
        </CardTitle>
        <p className="text-[10px] text-muted-foreground mt-1">
          Scores are relative — 100 = best among compared stocks, 0 = worst. Not absolute ratings.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{
                fill: '#71717a',
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: 600,
              }}
            />
            {stocks.map((stock, i) => (
              <Radar
                key={stock.ticker}
                name={stock.ticker}
                dataKey={stock.ticker}
                stroke={COLORS[i]}
                fill={COLORS[i]}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            ))}
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '12px' }}
              formatter={(value) => (
                <span style={{ color: COLORS[stocks.findIndex((s) => s.ticker === value)] }}>
                  {value}
                </span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
