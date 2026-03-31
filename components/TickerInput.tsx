'use client';

// components/TickerInput.tsx
// Bloomberg-style ticker search bar

import { useState } from 'react';
import { Search, Loader2, ChevronRight } from 'lucide-react';

interface TickerInputProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
}

const QUICK_PICKS = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN', 'META', 'GOOGL'];

export default function TickerInput({ onSearch, isLoading }: TickerInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = value.trim().toUpperCase();
    if (t) onSearch(t);
  }

  return (
    <div className="bb-panel overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ background: 'oklch(0.095 0 0)', borderColor: 'oklch(0.14 0 0)' }}
      >
        <Search size={10} style={{ color: 'oklch(0.40 0 0)' }} />
        <span className="label-xs font-bold" style={{ color: 'oklch(0.40 0 0)' }}>
          TICKER SEARCH
        </span>
        <ChevronRight size={9} style={{ color: 'oklch(0.25 0 0)' }} />
        <span className="label-xs" style={{ color: 'oklch(0.30 0 0)' }}>
          ENTER SYMBOL TO ANALYZE
        </span>
      </div>

      {/* Input row */}
      <div className="p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            {/* Prefix */}
            <span
              className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold select-none"
              style={{ color: 'oklch(0.72 0.18 88)' }}
            >
              &gt;
            </span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value.toUpperCase())}
              placeholder="AAPL, NVDA, MSFT, TSLA…"
              disabled={isLoading}
              className="w-full h-9 pl-7 pr-3 font-mono text-[13px] uppercase tracking-wider rounded-sm border outline-none transition-colors"
              style={{
                background: 'oklch(0.09 0 0)',
                borderColor: 'oklch(0.18 0 0)',
                color: 'oklch(0.85 0 0)',
              }}
              onFocus={e  => (e.target.style.borderColor = 'oklch(0.72 0.18 88)')}
              onBlur={e   => (e.target.style.borderColor = 'oklch(0.18 0 0)')}
            />
            {isLoading && (
              <Loader2
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin"
                style={{ color: 'oklch(0.72 0.18 88)' }}
              />
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !value.trim()}
            className="h-9 px-5 font-mono font-bold text-[11px] tracking-widest rounded-sm transition-all disabled:opacity-40"
            style={{
              background: isLoading ? 'oklch(0.55 0.12 88)' : 'oklch(0.72 0.18 88)',
              color: 'oklch(0.06 0 0)',
            }}
          >
            {isLoading ? 'ANALYZING…' : 'ANALYZE'}
          </button>
        </form>

        {/* Quick picks */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span className="label-xs" style={{ color: 'oklch(0.30 0 0)' }}>QUICK:</span>
          {QUICK_PICKS.map((t) => (
            <button
              key={t}
              onClick={() => { setValue(t); onSearch(t); }}
              disabled={isLoading}
              className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm border transition-all disabled:opacity-30"
              style={{
                color: 'oklch(0.72 0.18 88)',
                borderColor: 'oklch(0.20 0.05 88)',
                background: 'oklch(0.09 0.01 88)',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.background = 'oklch(0.72 0.18 88)';
                (e.target as HTMLElement).style.color = 'oklch(0.06 0 0)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.background = 'oklch(0.09 0.01 88)';
                (e.target as HTMLElement).style.color = 'oklch(0.72 0.18 88)';
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
