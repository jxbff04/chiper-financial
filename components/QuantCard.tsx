// components/QuantCard.tsx
// Renders the quantitative screening flags table

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuantFlag } from '@/lib/types';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface QuantCardProps {
  flags: QuantFlag[];
}

// Map status to color + icon
const STATUS_CONFIG = {
  PASS: {
    badgeClass: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    icon: ShieldCheck,
    iconClass: 'text-emerald-400',
  },
  WARN: {
    badgeClass: 'bg-yellow-950 text-yellow-400 border-yellow-800',
    icon: ShieldAlert,
    iconClass: 'text-yellow-400',
  },
  FAIL: {
    badgeClass: 'bg-red-950 text-red-400 border-red-800',
    icon: ShieldX,
    iconClass: 'text-red-400',
  },
};

export default function QuantCard({ flags }: QuantCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Quantitative Screening
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2">
          {flags.map((flag, i) => {
            const config = STATUS_CONFIG[flag.status];
            const Icon = config.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3 py-2 border-b border-border last:border-0"
              >
                {/* Status icon */}
                <Icon size={14} className={`mt-0.5 shrink-0 ${config.iconClass}`} />

                <div className="flex-1 min-w-0">
                  {/* Metric name + value + badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{flag.metric}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-foreground">{flag.value}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 font-bold ${config.badgeClass}`}
                      >
                        {flag.status}
                      </Badge>
                    </div>
                  </div>
                  {/* Threshold + note */}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Threshold: {flag.threshold} — {flag.note}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}