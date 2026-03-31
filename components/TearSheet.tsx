// components/TearSheet.tsx
// The AI-generated institutional tear sheet — the centerpiece output

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TearSheetData } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface TearSheetProps {
  data: TearSheetData;
}

const VERDICT_CONFIG = {
  ACCUMULATE: {
    color: 'text-emerald-400',
    badgeClass: 'bg-emerald-950 text-emerald-400 border-emerald-700',
    icon: TrendingUp,
    borderClass: 'border-emerald-900',
  },
  HOLD: {
    color: 'text-yellow-400',
    badgeClass: 'bg-yellow-950 text-yellow-400 border-yellow-700',
    icon: Minus,
    borderClass: 'border-yellow-900',
  },
  AVOID: {
    color: 'text-red-400',
    badgeClass: 'bg-red-950 text-red-400 border-red-700',
    icon: TrendingDown,
    borderClass: 'border-red-900',
  },
};

export default function TearSheet({ data }: TearSheetProps) {
  const verdict = VERDICT_CONFIG[data.verdict];
  const VerdictIcon = verdict.icon;

  return (
    <Card className={`border-2 ${verdict.borderClass} bg-card`}>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            AI Synthesis — Zero-Bias Tear Sheet
          </CardTitle>
          {/* Confidence score */}
          <span className="text-[10px] text-muted-foreground">
            Data Confidence:{' '}
            <span className="text-foreground font-bold">{data.confidenceScore}%</span>
          </span>
        </div>

        {/* Big verdict display */}
        <div className="flex items-center gap-3 mt-3">
          <VerdictIcon size={28} className={verdict.color} />
          <div>
            <Badge
              variant="outline"
              className={`text-base px-3 py-1 font-black tracking-widest ${verdict.badgeClass}`}
            >
              {data.verdict}
            </Badge>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xl">
              {data.verdictRationale}
            </p>
          </div>
        </div>
      </CardHeader>

      <Separator className="bg-border" />

      <CardContent className="px-4 pb-4 pt-4 space-y-5">
        {/* Executive Summary */}
        <Section icon={Info} title="Executive Summary" iconClass="text-zinc-400">
          {data.executiveSummary.map((point, i) => (
            <BulletPoint key={i} text={point} color="text-zinc-300" marker="›" />
          ))}
        </Section>

        <Separator className="bg-border" />

        {/* Bull Case */}
        <Section icon={TrendingUp} title="Bull Case — Data-Driven Upside" iconClass="text-emerald-400">
          {data.bullCase.map((point, i) => (
            <BulletPoint key={i} text={point} color="text-emerald-100" marker="▲" markerColor="text-emerald-500" />
          ))}
        </Section>

        <Separator className="bg-border" />

        {/* Bear Case */}
        <Section icon={AlertTriangle} title="Bear Case — Risk Assessment" iconClass="text-red-400">
          {data.bearCase.map((point, i) => (
            <BulletPoint
              key={i}
              text={point}
              color="text-red-100"
              marker="▼"
              markerColor="text-red-500"
              // Highlight lines that start with CRITICAL
              highlight={point.startsWith('CRITICAL')}
            />
          ))}
        </Section>

        {/* Timestamp */}
        <p className="text-[9px] text-muted-foreground text-right">
          Generated: {new Date(data.generatedAt).toLocaleString()} · This is not financial advice.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  iconClass,
  children,
}: {
  icon: React.ElementType;
  title: string;
  iconClass: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={12} className={iconClass} />
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BulletPoint({
  text,
  color,
  marker,
  markerColor = 'text-muted-foreground',
  highlight = false,
}: {
  text: string;
  color: string;
  marker: string;
  markerColor?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-2 text-xs leading-relaxed rounded px-2 py-1 ${
        highlight ? 'bg-red-950/40 border border-red-900/50' : ''
      }`}
    >
      <span className={`shrink-0 mt-0.5 font-bold ${markerColor}`}>{marker}</span>
      <span className={color}>{text}</span>
    </div>
  );
}