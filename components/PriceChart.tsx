// components/PriceChart.tsx
// 30-day price chart with candlestick bars + volume bars
// Built with Recharts ComposedChart

'use client';

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceCandle } from '@/lib/types';

interface PriceChartProps {
  candles: PriceCandle[];
  ticker: string;
  currentPrice: number;
}

// Custom candlestick bar shape
// Recharts Bar only draws rectangles, so we draw the full candle manually as SVG
function CandlestickBar(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: PriceCandle;
  chartHeight?: number;
  yMin?: number;
  yMax?: number;
  yAxisScale?: (val: number) => number;
}) {
  const { x = 0, width = 0, payload } = props;
  if (!payload) return null;

  const { open, high, low, close, isGreen } = payload;

  // We need the actual pixel positions from the scale
  // These are passed via the custom tick / scale system
  // For simplicity, use the Bar's y/height for the body
  // and draw wicks using the same scale
  const color = isGreen ? '#34d399' : '#f87171'; // emerald-400 : red-400
  const wickColor = isGreen ? '#6ee7b7' : '#fca5a5';

  // Center x of the candle
  const cx = x + width / 2;

  // The Bar chart will give us y/height for the close-open body range
  // We render this as a group — the actual wick positions need
  // to be derived. We use a normalized approach via the payload values.
  // Since Recharts passes y/height relative to the chart domain,
  // we calculate wick positions proportionally.
  const { y = 0, height = 0, yMin = 0, yMax = 1 } = props;
  const range = yMax - yMin;
  if (range === 0) return null;

  // Helper: convert a price value to a pixel Y coordinate
  // chartHeight is the full plot area height
  const chartHeight = props.chartHeight ?? 200;
  const toPixel = (val: number) =>
    chartHeight - ((val - yMin) / range) * chartHeight;

  const bodyTop = Math.min(toPixel(open), toPixel(close));
  const bodyHeight = Math.max(Math.abs(toPixel(open) - toPixel(close)), 1);
  const wickTop = toPixel(high);
  const wickBottom = toPixel(low);

  // Suppress unused variable warnings — y/height come from recharts
  void y;
  void height;

  return (
    <g>
      {/* Upper wick */}
      <line
        x1={cx} y1={wickTop}
        x2={cx} y2={bodyTop}
        stroke={wickColor} strokeWidth={1}
      />
      {/* Candle body */}
      <rect
        x={x + width * 0.15}
        y={bodyTop}
        width={width * 0.7}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={0.5}
        opacity={0.9}
      />
      {/* Lower wick */}
      <line
        x1={cx} y1={bodyTop + bodyHeight}
        x2={cx} y2={wickBottom}
        stroke={wickColor} strokeWidth={1}
      />
    </g>
  );
}

// Custom tooltip shown on hover
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: PriceCandle }[];
}) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded p-3 text-xs font-mono shadow-xl">
      <p className="text-zinc-400 mb-2 font-bold">{d.date}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-zinc-500">Open</span>
        <span className="text-zinc-200">${d.open.toFixed(2)}</span>
        <span className="text-zinc-500">High</span>
        <span className="text-emerald-400">${d.high.toFixed(2)}</span>
        <span className="text-zinc-500">Low</span>
        <span className="text-red-400">${d.low.toFixed(2)}</span>
        <span className="text-zinc-500">Close</span>
        <span className={d.isGreen ? 'text-emerald-400' : 'text-red-400'}>
          ${d.close.toFixed(2)}
        </span>
        <span className="text-zinc-500">Change</span>
        <span className={d.isGreen ? 'text-emerald-400' : 'text-red-400'}>
          {d.isGreen ? '+' : ''}{d.changePct.toFixed(2)}%
        </span>
        <span className="text-zinc-500">Volume</span>
        <span className="text-zinc-300">
          {d.volume >= 1e6
            ? (d.volume / 1e6).toFixed(1) + 'M'
            : d.volume.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function PriceChart({ candles, ticker, currentPrice }: PriceChartProps) {
  if (!candles || candles.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-xs text-muted-foreground">
            Price history unavailable for {ticker}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate price domain with 2% padding so candles are not clipped
  const allPrices = candles.flatMap((c) => [c.high, c.low]);
  const priceMin = Math.min(...allPrices);
  const priceMax = Math.max(...allPrices);
  const padding = (priceMax - priceMin) * 0.08;
  const yMin = priceMin - padding;
  const yMax = priceMax + padding;

  // Volume domain — max volume with headroom
  const maxVolume = Math.max(...candles.map((c) => c.volume));

  // Period performance
  const firstClose = candles[0].close;
  const lastClose = candles[candles.length - 1].close;
  const periodChange = ((lastClose - firstClose) / firstClose) * 100;
  const isPeriodPositive = periodChange >= 0;

  // Chart plot area height (must match ResponsiveContainer aspect)
  const CHART_HEIGHT = 220;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            30-Day Price History — {ticker}
          </CardTitle>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-muted-foreground">
              Current:{' '}
              <span className="text-foreground font-bold">${currentPrice.toFixed(2)}</span>
            </span>
            <span className={isPeriodPositive ? 'text-emerald-400' : 'text-red-400'}>
              30D: {isPeriodPositive ? '+' : ''}{periodChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-4">
        {/* ── Price Candlestick Chart ── */}
        <div className="mb-1">
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest px-2 mb-1">
            Price (USD)
          </p>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <ComposedChart
              data={candles}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="#1f1f1f"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => '$' + v.toFixed(0)}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />

              {/* Reference line at current price */}
              <ReferenceLine
                y={currentPrice}
                stroke="#52525b"
                strokeDasharray="3 3"
                strokeWidth={1}
              />

              {/* Candlestick bars — rendered as custom shape */}
              <Bar dataKey="high" shape={(props: object) => {
                const p = props as {
                  x?: number; y?: number; width?: number; height?: number; payload?: PriceCandle;
                };
                return (
                  <CandlestickBar
                    {...p}
                    yMin={yMin}
                    yMax={yMax}
                    chartHeight={CHART_HEIGHT}
                  />
                );
              }}>
                {candles.map((entry, index) => (
                  <Cell
                    key={'cell-' + index}
                    fill={entry.isGreen ? '#34d399' : '#f87171'}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* ── Volume Bar Chart ── */}
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest px-2 mb-1">
            Volume
          </p>
          <ResponsiveContainer width="100%" height={60}>
            <ComposedChart
              data={candles}
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <YAxis
                domain={[0, maxVolume * 1.2]}
                tick={false}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <XAxis dataKey="date" hide />
              <Bar dataKey="volume" maxBarSize={12}>
                {candles.map((entry, index) => (
                  <Cell
                    key={'vol-' + index}
                    fill={entry.isGreen ? '#065f46' : '#7f1d1d'}
                    opacity={0.8}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center gap-4 px-2 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-90" />
            <span className="text-[9px] text-muted-foreground">Bullish close</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500 opacity-90" />
            <span className="text-[9px] text-muted-foreground">Bearish close</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 border-t border-dashed border-zinc-600" />
            <span className="text-[9px] text-muted-foreground">Current price</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
