// components/MetricCard.tsx
// Displays a single KPI (price, market cap, etc.) in a compact terminal-style card

import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;         // optional secondary line (e.g. % change)
  subValueColor?: 'green' | 'red' | 'muted';
  highlight?: boolean;       // makes the card slightly brighter
}

export default function MetricCard({
  label,
  value,
  subValue,
  subValueColor = 'muted',
  highlight = false,
}: MetricCardProps) {
  const subColors = {
    green: 'text-emerald-400',
    red: 'text-red-400',
    muted: 'text-muted-foreground',
  };

  return (
    <Card className={`border-border bg-card ${highlight ? 'border-emerald-800' : ''}`}>
      <CardContent className="p-3">
        {/* Metric label */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          {label}
        </p>
        {/* Primary value */}
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        {/* Optional secondary value */}
        {subValue && (
          <p className={`text-xs mt-0.5 font-medium ${subColors[subValueColor]}`}>
            {subValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}