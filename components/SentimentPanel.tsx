// components/SentimentPanel.tsx
// Displays the 10 news headlines with their sentiment badges
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewsItem } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

interface SentimentPanelProps {
  news: NewsItem[];
}

const SENTIMENT_CONFIG: Record<string, string> = {
  POSITIVE: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  NEGATIVE: 'bg-red-950 text-red-400 border-red-800',
  NEUTRAL: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

// Format ISO date string to readable short format
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SentimentPanel({ news }: SentimentPanelProps) {
  // Count each sentiment type for the summary bar
  const counts = news.reduce(
    (acc, n) => {
      if (n.sentiment) acc[n.sentiment] = (acc[n.sentiment] || 0) + 1;
      return acc;
    },
    { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 } as Record<string, number>
  );

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            News Sentiment -- Last 10 Headlines
          </CardTitle>
          <div className="flex gap-2">
            <span className="text-[10px] text-emerald-400 font-bold">
              + {counts.POSITIVE}
            </span>
            <span className="text-[10px] text-red-400 font-bold">
              - {counts.NEGATIVE}
            </span>
            <span className="text-[10px] text-zinc-400 font-bold">
              o {counts.NEUTRAL}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="space-y-0">
          {news.map((item, i) => {
            const sentimentClass = item.sentiment
              ? SENTIMENT_CONFIG[item.sentiment]
              : 'bg-zinc-800 text-zinc-500 border-zinc-700';

            return (
              <div
                key={i}
                className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
              >
                {/* Sentiment badge - fixed width so headlines align */}
                <Badge
                  variant="outline"
                  className={'text-[9px] px-1.5 py-0 font-bold shrink-0 mt-0.5 w-16 justify-center ' + sentimentClass}
                >
                  {item.sentiment ?? '...'}
                </Badge>

                <div className="flex-1 min-w-0">
                  {/* Headline link */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      'text-xs text-foreground hover:text-emerald-400 ' +
                      'transition-colors leading-snug flex items-start gap-1 group'
                    }
                  >
                    <span>{item.headline}</span>
                    <ExternalLink
                      size={10}
                      className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </a>

                  {/* Source and publish date */}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {item.source} / {formatDate(item.publishedAt)}
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
