// components/ComparisonTable.tsx
// Side-by-side metrics table for competitor comparison
// Highlights the best value in each row with green, worst with red

'use client';

import { StockMetrics } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface ComparisonTableProps {
  stocks: StockMetrics[];
}

// Each row definition: label, how to extract value, formatting, and whether
// higher or lower is better (for coloring the best/worst)
interface RowDef {
  label: string;
  getValue: (m: StockMetrics) => number | null;
  format: (v: number) => string;
  higherIsBetter: boolean;
  threshold?: { warn: number; fail: number };
}

const ROWS: RowDef[] = [
  {
    label: 'Price',
    getValue: (m) => m.price,
    format: (v) => '$' + v.toFixed(2),
    higherIsBetter: false, // neutral — no coloring for price
  },
  {
    label: 'Market Cap',
    getValue: (m) => m.marketCap,
    format: (v) => {
      if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
      if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
      return '$' + (v / 1e6).toFixed(2) + 'M';
    },
    higherIsBetter: true,
  },
  {
    label: 'P/E Ratio',
    getValue: (m) => m.peRatio,
    format: (v) => v.toFixed(1) + 'x',
    higherIsBetter: false, // lower PE = cheaper = better
  },
  {
    label: 'PEG Ratio',
    getValue: (m) => m.pegRatio,
    format: (v) => v.toFixed(2),
    higherIsBetter: false, // lower PEG = better value
  },
  {
    label: 'EPS',
    getValue: (m) => m.eps,
    format: (v) => '$' + v.toFixed(2),
    higherIsBetter: true,
  },
  {
    label: 'Revenue Growth',
    getValue: (m) => m.revenueGrowthYoY,
    format: (v) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%',
    higherIsBetter: true,
  },
  {
    label: 'Gross Margin',
    getValue: (m) => m.grossMargin,
    format: (v) => v.toFixed(1) + '%',
    higherIsBetter: true,
  },
  {
    label: 'Debt / Equity',
    getValue: (m) => m.debtToEquity,
    format: (v) => v.toFixed(2),
    higherIsBetter: false, // lower debt = safer
  },
  {
    label: 'Free Cash Flow',
    getValue: (m) => m.freeCashFlow,
    format: (v) => '$' + v.toLocaleString() + 'M',
    higherIsBetter: true,
  },
  {
    label: '52W High',
    getValue: (m) => m.fiftyTwoWeekHigh,
    format: (v) => '$' + v.toFixed(2),
    higherIsBetter: false, // neutral
  },
  {
    label: 'vs 52W High',
    getValue: (m) =>
      m.fiftyTwoWeekHigh > 0
        ? ((m.price - m.fiftyTwoWeekHigh) / m.fiftyTwoWeekHigh) * 100
        : null,
    format: (v) => v.toFixed(1) + '%',
    higherIsBetter: true, // closer to high = stronger momentum
  },
  {
    label: 'Price Change',
    getValue: (m) => m.priceChangePct,
    format: (v) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%',
    higherIsBetter: true,
  },
];

// Colors for each ticker column header
const TICKER_COLORS = [
  'text-emerald-400 border-emerald-800',
  'text-blue-400 border-blue-800',
  'text-purple-400 border-purple-800',
];

const TICKER_BG = [
  'bg-emerald-950/30',
  'bg-blue-950/30',
  'bg-purple-950/30',
];

export default function ComparisonTable({ stocks }: ComparisonTableProps) {
  if (!stocks || stocks.length === 0) return null;

  // For each row, find which stock has the best and worst value
  function getBestWorst(row: RowDef): { bestIdx: number; worstIdx: number } | null {
    // Price and 52W High are neutral — no best/worst coloring
    if (row.label === 'Price' || row.label === '52W High') return null;

    const values = stocks.map((s) => row.getValue(s));
    const validValues = values.filter((v) => v !== null) as number[];
    if (validValues.length < 2) return null;

    const best = row.higherIsBetter
      ? Math.max(...validValues)
      : Math.min(...validValues);
    const worst = row.higherIsBetter
      ? Math.min(...validValues)
      : Math.max(...validValues);

    const bestIdx = values.findIndex((v) => v === best);
    const worstIdx = values.findIndex((v) => v === worst);

    // Only color if there's a meaningful difference
    if (bestIdx === worstIdx) return null;
    return { bestIdx, worstIdx };
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        {/* ── Header Row ── */}
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold w-36">
              Metric
            </th>
            {stocks.map((s, i) => (
              <th key={s.ticker} className="py-2.5 px-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Badge
                    variant="outline"
                    className={'text-sm font-black px-3 py-0.5 ' + TICKER_COLORS[i]}
                  >
                    {s.ticker}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground font-normal truncate max-w-[120px]">
                    {s.companyName}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Data Rows ── */}
        <tbody>
          {ROWS.map((row, rowIdx) => {
            const bestWorst = getBestWorst(row);

            return (
              <tr
                key={row.label}
                className={
                  'border-b border-border last:border-0 ' +
                  (rowIdx % 2 === 0 ? 'bg-zinc-950/40' : '')
                }
              >
                {/* Metric label */}
                <td className="py-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {row.label}
                </td>

                {/* Value cells */}
                {stocks.map((stock, colIdx) => {
                  const value = row.getValue(stock);
                  const isBest = bestWorst?.bestIdx === colIdx;
                  const isWorst = bestWorst?.worstIdx === colIdx;

                  return (
                    <td
                      key={stock.ticker}
                      className={
                        'py-2 px-3 text-center font-bold ' +
                        (isBest
                          ? 'text-emerald-400 ' + TICKER_BG[colIdx]
                          : isWorst
                          ? 'text-red-400'
                          : 'text-foreground')
                      }
                    >
                      <div className="flex items-center justify-center gap-1">
                        {value !== null ? row.format(value) : (
                          <span className="text-muted-foreground font-normal">N/A</span>
                        )}
                        {isBest && (
                          <span className="text-[8px] text-emerald-500 font-black">BEST</span>
                        )}
                        {isWorst && (
                          <span className="text-[8px] text-red-500 font-black">WEAK</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
