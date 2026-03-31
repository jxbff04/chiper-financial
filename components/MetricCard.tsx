'use client';

// components/MetricCard.tsx
// Dense Bloomberg-style KPI tile

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  subValueColor?: 'green' | 'red' | 'amber' | 'cyan' | 'muted';
  highlight?: boolean;
  accent?: 'green' | 'red' | 'amber' | 'cyan' | 'purple' | 'none';
  delta?: 'up' | 'down' | 'neutral';
  size?: 'sm' | 'md';
}

const ACCENT_COLORS = {
  green:  'oklch(0.70 0.17 142)',
  red:    'oklch(0.60 0.22 25)',
  amber:  'oklch(0.72 0.18 88)',
  cyan:   'oklch(0.75 0.12 200)',
  purple: 'oklch(0.65 0.16 285)',
  none:   'oklch(0.72 0.18 88)',
};

const SUB_COLORS = {
  green:  'oklch(0.70 0.17 142)',
  red:    'oklch(0.60 0.22 25)',
  amber:  'oklch(0.72 0.18 88)',
  cyan:   'oklch(0.75 0.12 200)',
  muted:  'oklch(0.45 0 0)',
};

export default function MetricCard({
  label,
  value,
  subValue,
  subValueColor = 'muted',
  highlight = false,
  accent = 'none',
  delta,
  size = 'md',
}: MetricCardProps) {
  const accentColor = ACCENT_COLORS[accent];
  const subColor = SUB_COLORS[subValueColor];

  const DeltaIcon =
    delta === 'up'   ? TrendingUp :
    delta === 'down' ? TrendingDown :
    delta === 'neutral' ? Minus : null;

  const deltaColor =
    delta === 'up'   ? 'oklch(0.70 0.17 142)' :
    delta === 'down' ? 'oklch(0.60 0.22 25)' :
    'oklch(0.45 0 0)';

  return (
    <div
      className="bb-metric relative overflow-hidden group cursor-default"
      style={{
        borderTopColor: highlight ? accentColor : undefined,
        borderTopWidth: highlight ? '2px' : undefined,
      }}
    >
      {/* Corner accent dot */}
      {highlight && (
        <span
          className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full"
          style={{ background: accentColor, opacity: 0.8 }}
        />
      )}

      {/* Label */}
      <div
        className="label-xs mb-1.5"
        style={{ color: 'oklch(0.40 0 0)' }}
      >
        {label}
      </div>

      {/* Value row */}
      <div className="flex items-baseline justify-between gap-1">
        <span
          className="font-mono tabular-nums font-semibold leading-none"
          style={{
            fontSize: size === 'sm' ? '14px' : '17px',
            color: highlight ? accentColor : 'oklch(0.92 0 0)',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </span>
        {DeltaIcon && (
          <DeltaIcon
            size={11}
            style={{ color: deltaColor, flexShrink: 0 }}
          />
        )}
      </div>

      {/* Sub value */}
      {subValue && (
        <div
          className="font-mono text-[10px] mt-1 tabular-nums"
          style={{ color: subColor }}
        >
          {subValue}
        </div>
      )}
    </div>
  );
}
